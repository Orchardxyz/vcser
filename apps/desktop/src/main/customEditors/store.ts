import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { app } from "electron";
import { getPrismaClient } from "@vcser/core/db";
import type { CustomEditorInput, CustomEditorRecord, UpdateCustomEditorInput } from "@vcser/core/types";

const CUSTOM_EDITOR_STORE_ERROR_CODE = {
  NOT_FOUND: "custom_editor_not_found",
  UNAVAILABLE: "custom_editor_store_unavailable"
} as const;

export type CustomEditorStoreErrorCode = (typeof CUSTOM_EDITOR_STORE_ERROR_CODE)[keyof typeof CUSTOM_EDITOR_STORE_ERROR_CODE];

export class CustomEditorStoreError extends Error {
  readonly code: CustomEditorStoreErrorCode;

  constructor(code: CustomEditorStoreErrorCode, message: string) {
    super(message);
    this.name = "CustomEditorStoreError";
    this.code = code;
  }
}

interface CustomEditorsFile {
  editors: CustomEditorRecord[];
}

let ensureInitializedPromise: Promise<void> | null = null;

function logCustomEditorStore(message: string, details?: unknown) {
  if (details === undefined) {
    console.info(`[vcser][custom-editor][store] ${message}`);
    return;
  }

  console.info(`[vcser][custom-editor][store] ${message}`, details);
}

function resolveCustomEditorsFilePath() {
  return join(app.getPath("userData"), "custom-editors.json");
}

function isCustomEditorRecord(value: unknown): value is CustomEditorRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.slug === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.displayName === "string" &&
    typeof candidate.extensionsPath === "string" &&
    typeof candidate.settingsPath === "string" &&
    typeof candidate.createdAt === "string"
  );
}

function normalizeRequiredString(value: string) {
  return value.trim();
}

function normalizeOptionalString(value?: string) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function normalizeCustomEditorInput(input: CustomEditorInput) {
  const normalizedName = normalizeRequiredString(input.name);

  return {
    name: normalizedName,
    displayName: normalizedName,
    cli: normalizeOptionalString(input.cli),
    appPath: normalizeOptionalString(input.appPath),
    extensionsPath: normalizeRequiredString(input.extensionsPath),
    settingsPath: normalizeRequiredString(input.settingsPath)
  };
}

function slugifyName(name: string) {
  const normalized = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "editor";
}

function createUniqueCustomSlug(name: string, reservedSlugs: Iterable<string>) {
  const base = `custom-${slugifyName(name)}`;
  const used = new Set(reservedSlugs);

  if (!used.has(base)) {
    return base;
  }

  let index = 2;
  while (used.has(`${base}-${index}`)) {
    index += 1;
  }

  return `${base}-${index}`;
}

function readCustomEditorsFile(): CustomEditorsFile {
  const filePath = resolveCustomEditorsFilePath();

  if (!existsSync(filePath)) {
    return { editors: [] };
  }

  try {
    const raw = readFileSync(filePath, "utf8");
    const parsed: unknown = JSON.parse(raw);

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { editors: [] };
    }

    const maybeEditors = "editors" in parsed ? (parsed as { editors?: unknown }).editors : undefined;
    if (!Array.isArray(maybeEditors)) {
      return { editors: [] };
    }

    return {
      editors: maybeEditors.filter(isCustomEditorRecord)
    };
  } catch (error) {
    console.warn("[vcser] Failed to read custom editors file.", error);
    return { editors: [] };
  }
}

function isSqliteBindingUnavailable(error: unknown): boolean {
  if (!(error instanceof Error) && (!error || typeof error !== "object" || !("code" in error))) {
    return false;
  }

  const message = error instanceof Error ? error.message : "";
  const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";

  return (
    message.includes("Could not locate the bindings file") ||
    message.includes("better_sqlite3.node") ||
    message.includes("NODE_MODULE_VERSION") ||
    code === "ERR_DLOPEN_FAILED"
  );
}

function handleUnavailablePrisma(error: unknown): boolean {
  if (!isSqliteBindingUnavailable(error)) {
    return false;
  }

  ensureInitializedPromise = null;
  return true;
}

function toCustomEditorRecord(editor: {
  id: string;
  slug: string;
  name: string;
  displayName: string;
  cli: string | null;
  appPath: string | null;
  extensionsPath: string;
  settingsPath: string;
  createdAt: Date;
}): CustomEditorRecord {
  return {
    id: editor.id,
    slug: editor.slug,
    name: editor.name,
    displayName: editor.displayName,
    cli: editor.cli ?? undefined,
    appPath: editor.appPath ?? undefined,
    extensionsPath: editor.extensionsPath,
    settingsPath: editor.settingsPath,
    createdAt: editor.createdAt.toISOString()
  };
}

function resolveCodeBuddySeed() {
  const home = homedir();

  return {
    slug: "custom-codebuddy",
    name: "CodeBuddy",
    displayName: "CodeBuddy",
    appPath: "/Applications/CodeBuddy.app",
    extensionsPath: join(home, ".codebuddy", "extensions"),
    settingsPath: join(home, "Library", "Application Support", "CodeBuddy", "User", "settings.json")
  };
}

async function importLegacyCustomEditors() {
  const prisma = getPrismaClient();
  if (!prisma) {
    logCustomEditorStore("Skipped legacy import because Prisma client is unavailable.");
    return;
  }

  const legacyEditors = readCustomEditorsFile().editors;
  logCustomEditorStore("Loaded legacy custom editors for import.", {
    filePath: resolveCustomEditorsFilePath(),
    count: legacyEditors.length
  });

  for (const legacyEditor of legacyEditors) {
    const existing = await prisma.customEditor.findUnique({
      where: {
        slug: legacyEditor.slug
      }
    });

    if (existing) {
      logCustomEditorStore("Skipped legacy editor import because slug already exists.", {
        slug: legacyEditor.slug
      });
      continue;
    }

    logCustomEditorStore("Importing legacy custom editor.", {
      id: legacyEditor.id,
      slug: legacyEditor.slug,
      name: legacyEditor.name
    });
    await prisma.customEditor.create({
      data: {
        id: legacyEditor.id,
        slug: legacyEditor.slug,
        name: normalizeRequiredString(legacyEditor.name),
        displayName: normalizeRequiredString(legacyEditor.displayName),
        cli: normalizeOptionalString(legacyEditor.cli),
        appPath: normalizeOptionalString(legacyEditor.appPath),
        extensionsPath: normalizeRequiredString(legacyEditor.extensionsPath),
        settingsPath: normalizeRequiredString(legacyEditor.settingsPath),
        createdAt: new Date(legacyEditor.createdAt)
      }
    });
  }
}

async function ensureCodeBuddySeed() {
  const prisma = getPrismaClient();
  if (!prisma) {
    logCustomEditorStore("Skipped CodeBuddy seed because Prisma client is unavailable.");
    return;
  }

  const seed = resolveCodeBuddySeed();

  if (!existsSync(seed.appPath) || !existsSync(seed.extensionsPath) || !existsSync(seed.settingsPath)) {
    logCustomEditorStore("Skipped CodeBuddy seed because one or more paths do not exist.", seed);
    return;
  }

  const existing = await prisma.customEditor.findUnique({
    where: {
      slug: seed.slug
    }
  });

  if (existing) {
    logCustomEditorStore("Skipped CodeBuddy seed because it already exists.", {
      slug: seed.slug
    });
    return;
  }

  logCustomEditorStore("Creating CodeBuddy seed.", seed);
  await prisma.customEditor.create({
    data: seed
  });
}

async function ensureCustomEditorsInitialized() {
  if (ensureInitializedPromise) {
    logCustomEditorStore("Reusing in-flight custom editor initialization.");
    return ensureInitializedPromise;
  }

  async function initializeCustomEditors() {
    await importLegacyCustomEditors();
    await ensureCodeBuddySeed();
  }

  ensureInitializedPromise = initializeCustomEditors();
  logCustomEditorStore("Started custom editor initialization.");

  try {
    await ensureInitializedPromise;
    logCustomEditorStore("Finished custom editor initialization.");
  } catch (error) {
    ensureInitializedPromise = null;
    logCustomEditorStore("Custom editor initialization failed.", error);

    if (handleUnavailablePrisma(error)) {
      return;
    }

    throw error;
  }
}

function requirePrismaClient() {
  const prisma = getPrismaClient();

  if (!prisma) {
    logCustomEditorStore("Prisma client is unavailable when custom editor storage is required.");
    throw new CustomEditorStoreError(CUSTOM_EDITOR_STORE_ERROR_CODE.UNAVAILABLE, "Custom editor storage is unavailable.");
  }

  logCustomEditorStore("Prisma client is available.");
  return prisma;
}

export async function listCustomEditors(): Promise<CustomEditorRecord[]> {
  const prisma = requirePrismaClient();

  try {
    await ensureCustomEditorsInitialized();
    const editors = await prisma.customEditor.findMany({
      orderBy: {
        createdAt: "asc"
      }
    });

    return editors.map(toCustomEditorRecord);
  } catch (error) {
    if (handleUnavailablePrisma(error)) {
      throw new CustomEditorStoreError(CUSTOM_EDITOR_STORE_ERROR_CODE.UNAVAILABLE, "Custom editor storage is unavailable.");
    }

    throw error;
  }
}

export async function appendCustomEditor(input: CustomEditorInput, reservedSlugs: Iterable<string>): Promise<CustomEditorRecord> {
  const prisma = requirePrismaClient();
  logCustomEditorStore("Appending custom editor.", {
    input,
    reservedSlugs: [...reservedSlugs]
  });

  try {
    await ensureCustomEditorsInitialized();

    const existing = await prisma.customEditor.findMany({
      select: {
        slug: true
      }
    });
    const normalized = normalizeCustomEditorInput(input);
    const slug = createUniqueCustomSlug(normalized.name, [...reservedSlugs, ...existing.map((editor) => editor.slug)]);
    logCustomEditorStore("Computed custom editor values for create.", {
      normalized,
      existingSlugs: existing.map((editor) => editor.slug),
      slug
    });
    const record = await prisma.customEditor.create({
      data: {
        slug,
        ...normalized
      }
    });

    logCustomEditorStore("Created custom editor record.", record);
    return toCustomEditorRecord(record);
  } catch (error) {
    logCustomEditorStore("Failed to append custom editor.", error);
    if (handleUnavailablePrisma(error)) {
      throw new CustomEditorStoreError(CUSTOM_EDITOR_STORE_ERROR_CODE.UNAVAILABLE, "Custom editor storage is unavailable.");
    }

    throw error;
  }
}

export async function updateCustomEditor(input: UpdateCustomEditorInput): Promise<CustomEditorRecord> {
  const prisma = requirePrismaClient();

  try {
    await ensureCustomEditorsInitialized();

    const existing = await prisma.customEditor.findUnique({
      where: {
        id: input.id
      }
    });

    if (!existing) {
      throw new CustomEditorStoreError(CUSTOM_EDITOR_STORE_ERROR_CODE.NOT_FOUND, `Custom editor ${input.id} not found.`);
    }

    const normalized = normalizeCustomEditorInput(input);
    const record = await prisma.customEditor.update({
      where: {
        id: input.id
      },
      data: normalized
    });

    return toCustomEditorRecord(record);
  } catch (error) {
    if (handleUnavailablePrisma(error)) {
      throw new CustomEditorStoreError(CUSTOM_EDITOR_STORE_ERROR_CODE.UNAVAILABLE, "Custom editor storage is unavailable.");
    }

    throw error;
  }
}

export async function removeCustomEditor(id: string): Promise<CustomEditorRecord> {
  const prisma = requirePrismaClient();

  try {
    await ensureCustomEditorsInitialized();

    const existing = await prisma.customEditor.findUnique({
      where: {
        id
      }
    });

    if (!existing) {
      throw new CustomEditorStoreError(CUSTOM_EDITOR_STORE_ERROR_CODE.NOT_FOUND, `Custom editor ${id} not found.`);
    }

    const record = await prisma.customEditor.delete({
      where: {
        id
      }
    });

    return toCustomEditorRecord(record);
  } catch (error) {
    if (handleUnavailablePrisma(error)) {
      throw new CustomEditorStoreError(CUSTOM_EDITOR_STORE_ERROR_CODE.UNAVAILABLE, "Custom editor storage is unavailable.");
    }

    throw error;
  }
}
