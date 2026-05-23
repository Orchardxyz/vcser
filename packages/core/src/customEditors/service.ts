import { getPrismaClient, getPrismaUnavailableReason } from "../db.js";
import type { CustomEditorInput, CustomEditorRecord } from "../shared/types.js";
import {
  createUniqueCustomSlug,
  CustomEditorStoreError,
  type CustomEditorConflictCandidate,
  type CustomEditorSeedInput,
  findConflict,
  type InitializeCustomEditorStorageOptions,
  normalizeCustomEditorInput,
  normalizeOptionalString,
  normalizeRequiredString,
  normalizeSeedEditor,
  toCustomEditorRecord
} from "./shared.js";

let ensureInitializedPromise: Promise<void> | null = null;
let initializationCompleted = false;

function logCustomEditorStore(message: string, details?: unknown) {
  if (details === undefined) {
    console.info(`[vcser][custom-editor][store] ${message}`);
    return;
  }

  console.info(`[vcser][custom-editor][store] ${message}`, details);
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
  initializationCompleted = false;
  return true;
}

function requirePrismaClient() {
  const prisma = getPrismaClient();

  if (!prisma) {
    logCustomEditorStore("Prisma client is unavailable when custom editor storage is required.");
    const reason = getPrismaUnavailableReason();
    throw new CustomEditorStoreError(
      "custom_editor_store_unavailable",
      reason ? `Custom editor storage is unavailable. ${reason}` : "Custom editor storage is unavailable."
    );
  }

  return prisma;
}

async function importLegacyCustomEditors(legacyEditors: CustomEditorRecord[]): Promise<void> {
  if (legacyEditors.length === 0) {
    return;
  }

  const prisma = requirePrismaClient();

  for (const legacyEditor of legacyEditors) {
    const existing = await prisma.customEditor.findUnique({
      where: {
        slug: legacyEditor.slug
      }
    });

    if (existing) {
      continue;
    }

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

async function ensureSeedEditors(seedEditors: CustomEditorSeedInput[]): Promise<void> {
  if (seedEditors.length === 0) {
    return;
  }

  const prisma = requirePrismaClient();

  for (const seed of seedEditors) {
    const existing = await prisma.customEditor.findUnique({
      where: {
        slug: seed.slug
      }
    });

    if (existing) {
      continue;
    }

    await prisma.customEditor.create({
      data: {
        slug: seed.slug,
        name: normalizeRequiredString(seed.name),
        displayName: normalizeRequiredString(seed.displayName),
        cli: normalizeOptionalString(seed.cli),
        appPath: normalizeOptionalString(seed.appPath),
        extensionsPath: normalizeRequiredString(seed.extensionsPath),
        settingsPath: normalizeRequiredString(seed.settingsPath)
      }
    });
  }
}

async function applyInitializationOptions(options?: InitializeCustomEditorStorageOptions): Promise<void> {
  await importLegacyCustomEditors(options?.legacyEditors ?? []);
  await ensureSeedEditors(options?.seedEditors ?? []);
}

async function initializeStorage(options?: InitializeCustomEditorStorageOptions): Promise<void> {
  await applyInitializationOptions(options);
  initializationCompleted = true;
}

async function ensureStorageInitialized(options?: InitializeCustomEditorStorageOptions): Promise<void> {
  if (initializationCompleted) {
    return;
  }

  if (ensureInitializedPromise) {
    return ensureInitializedPromise;
  }

  ensureInitializedPromise = initializeStorage(options);

  try {
    await ensureInitializedPromise;
  } catch (error) {
    ensureInitializedPromise = null;

    if (handleUnavailablePrisma(error)) {
      return;
    }

    throw error;
  }
}

async function loadConflictCandidates(ignoredId?: string): Promise<CustomEditorConflictCandidate[]> {
  const prisma = requirePrismaClient();
  const editors = await prisma.customEditor.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      displayName: true,
      extensionsPath: true,
      settingsPath: true
    }
  });

  return editors
    .filter((editor) => !ignoredId || editor.id !== ignoredId)
    .map((editor) => ({
      id: editor.id,
      slug: editor.slug,
      name: editor.name,
      displayName: editor.displayName,
      extensionsPath: editor.extensionsPath,
      settingsPath: editor.settingsPath
    }));
}

async function assertNoEditorConflict(params: {
  input: ReturnType<typeof normalizeCustomEditorInput>;
  ignoredId?: string;
  reservedEditors?: CustomEditorConflictCandidate[];
}): Promise<void> {
  const storedEditors = await loadConflictCandidates(params.ignoredId);
  const conflict = findConflict(params.input, [...storedEditors, ...(params.reservedEditors ?? [])], params.ignoredId);

  if (!conflict) {
    return;
  }

  throw new CustomEditorStoreError("custom_editor_already_exists", "A matching editor configuration already exists.", {
    conflict
  });
}

export async function initializeCustomEditorStorage(options?: InitializeCustomEditorStorageOptions): Promise<void> {
  const normalizedOptions = {
    legacyEditors: options?.legacyEditors ?? [],
    seedEditors: (options?.seedEditors ?? []).map(normalizeSeedEditor)
  } satisfies InitializeCustomEditorStorageOptions;
  const wasInitialized = initializationCompleted;

  await ensureStorageInitialized(normalizedOptions);

  if (wasInitialized && (normalizedOptions.legacyEditors.length > 0 || normalizedOptions.seedEditors.length > 0)) {
    await applyInitializationOptions(normalizedOptions);
  }
}

export async function listCustomEditors(): Promise<CustomEditorRecord[]> {
  const prisma = requirePrismaClient();

  try {
    await ensureStorageInitialized();
    const editors = await prisma.customEditor.findMany({
      orderBy: {
        createdAt: "asc"
      }
    });

    return editors.map(toCustomEditorRecord);
  } catch (error) {
    if (handleUnavailablePrisma(error)) {
      throw new CustomEditorStoreError("custom_editor_store_unavailable", "Custom editor storage is unavailable.");
    }

    throw error;
  }
}

export async function appendCustomEditor(
  input: CustomEditorInput,
  options?: { reservedEditors?: CustomEditorConflictCandidate[]; reservedSlugs?: Iterable<string> }
): Promise<CustomEditorRecord> {
  const prisma = requirePrismaClient();

  try {
    await ensureStorageInitialized();

    const normalized = normalizeCustomEditorInput(input);
    await assertNoEditorConflict({
      input: normalized,
      reservedEditors: options?.reservedEditors
    });

    const existing = await prisma.customEditor.findMany({
      select: {
        slug: true
      }
    });
    const slug = createUniqueCustomSlug(normalized.name, [...(options?.reservedSlugs ?? []), ...existing.map((editor) => editor.slug)]);
    const record = await prisma.customEditor.create({
      data: {
        slug,
        ...normalized
      }
    });

    return toCustomEditorRecord(record);
  } catch (error) {
    if (handleUnavailablePrisma(error)) {
      throw new CustomEditorStoreError("custom_editor_store_unavailable", "Custom editor storage is unavailable.");
    }

    throw error;
  }
}
