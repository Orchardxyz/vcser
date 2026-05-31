import { existsSync } from "node:fs";
import { basename, extname } from "node:path";
import type { ValueOf } from "type-fest";
import { hasErrorCode, isCodedError, type CodedError } from "../errors.js";
import { hasStringProperty, isRecord } from "../typeGuards.js";
import type { CustomEditorInput, CustomEditorRecord } from "../shared/types.js";

export const CUSTOM_EDITOR_STORE_ERROR_CODE = {
  ALREADY_EXISTS: "custom_editor_already_exists",
  NOT_FOUND: "custom_editor_not_found",
  STORE_UNAVAILABLE: "custom_editor_store_unavailable"
} as const;

export type CustomEditorStoreErrorCode = ValueOf<typeof CUSTOM_EDITOR_STORE_ERROR_CODE>;

export interface CustomEditorConflictCandidate {
  id?: string;
  slug?: string;
  name: string;
  displayName: string;
  extensionsPath: string;
  settingsPath: string;
}

export interface CustomEditorSeedInput {
  slug: string;
  name: string;
  displayName: string;
  cli?: string;
  appPath?: string;
  extensionsPath: string;
  settingsPath: string;
}

export interface CustomEditorStoreConflict {
  editorName: string;
  field: "name" | "extensionsPath" | "settingsPath";
}

export interface InitializeCustomEditorStorageOptions {
  legacyEditors?: CustomEditorRecord[];
  seedEditors?: CustomEditorSeedInput[];
}

export interface NormalizedCustomEditorInput {
  name: string;
  displayName: string;
  cli?: string;
  appPath?: string;
  extensionsPath: string;
  settingsPath: string;
}

export class CustomEditorStoreError extends Error implements CodedError<CustomEditorStoreErrorCode> {
  readonly code: CustomEditorStoreErrorCode;
  readonly conflict?: CustomEditorStoreConflict;

  constructor(code: CustomEditorStoreErrorCode, message: string, options?: { conflict?: CustomEditorStoreConflict }) {
    super(message);
    this.name = "CustomEditorStoreError";
    this.code = code;
    this.conflict = options?.conflict;
  }
}

export function isCustomEditorStoreErrorCode(code: string): code is CustomEditorStoreErrorCode {
  return (Object.values(CUSTOM_EDITOR_STORE_ERROR_CODE) as string[]).includes(code);
}

export function isCustomEditorStoreError(error: unknown): error is CustomEditorStoreError {
  return (
    error instanceof CustomEditorStoreError ||
    (isCodedError(error) && error.name === "CustomEditorStoreError" && isCustomEditorStoreErrorCode(error.code))
  );
}

export function hasCustomEditorStoreErrorCode<Code extends CustomEditorStoreErrorCode>(
  error: unknown,
  code: Code
): error is CustomEditorStoreError & CodedError<Code> {
  return isCustomEditorStoreError(error) && hasErrorCode(error, code);
}

export function normalizeRequiredString(value: string) {
  return value.trim();
}

export function normalizeOptionalString(value?: string) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

export function normalizeCustomEditorInput(input: CustomEditorInput): NormalizedCustomEditorInput {
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

export function normalizeSeedEditor(seed: CustomEditorSeedInput): CustomEditorSeedInput {
  return {
    slug: normalizeRequiredString(seed.slug),
    name: normalizeRequiredString(seed.name),
    displayName: normalizeRequiredString(seed.displayName),
    cli: normalizeOptionalString(seed.cli),
    appPath: normalizeOptionalString(seed.appPath),
    extensionsPath: normalizeRequiredString(seed.extensionsPath),
    settingsPath: normalizeRequiredString(seed.settingsPath)
  };
}

export function slugifyName(name: string) {
  const normalized = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "editor";
}

export function createUniqueCustomSlug(name: string, reservedSlugs: Iterable<string>) {
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

export function toCustomEditorRecord(editor: {
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

export function findConflict(
  input: NormalizedCustomEditorInput,
  candidates: Iterable<CustomEditorConflictCandidate>,
  ignoredId?: string
): CustomEditorStoreConflict | undefined {
  for (const candidate of candidates) {
    if (ignoredId && candidate.id === ignoredId) {
      continue;
    }

    if (normalizeRequiredString(candidate.name) === input.name || normalizeRequiredString(candidate.displayName) === input.name) {
      return {
        editorName: candidate.displayName,
        field: "name"
      };
    }

    if (normalizeRequiredString(candidate.extensionsPath) === input.extensionsPath) {
      return {
        editorName: candidate.displayName,
        field: "extensionsPath"
      };
    }

    if (normalizeRequiredString(candidate.settingsPath) === input.settingsPath) {
      return {
        editorName: candidate.displayName,
        field: "settingsPath"
      };
    }
  }

  return undefined;
}

export function isCustomEditorRecord(value: unknown): value is CustomEditorRecord {
  if (!isRecord(value)) {
    return false;
  }

  return (
    hasStringProperty(value, "id") &&
    hasStringProperty(value, "slug") &&
    hasStringProperty(value, "name") &&
    hasStringProperty(value, "displayName") &&
    hasStringProperty(value, "extensionsPath") &&
    hasStringProperty(value, "settingsPath") &&
    hasStringProperty(value, "createdAt")
  );
}

export function inferCustomEditorNameFromAppPath(appPath: string): string {
  const extension = extname(appPath);
  return basename(appPath, extension || undefined).trim() || basename(appPath).trim();
}

export function isUnsupportedCustomEditorApp(params: { appPath?: string; suggestedName?: string; bundleIdentifier?: string }) {
  const candidates = [params.appPath, params.suggestedName, params.bundleIdentifier]
    .filter((value): value is string => Boolean(value && value.trim()))
    .map((value) => value.trim().toLowerCase());

  return candidates.some((value) => value.includes("url handler") || value.includes("url-handler"));
}

export function validateCustomEditorAppPath(appPath: string): { valid: true } | { valid: false; appName: string } {
  const suggestedName = inferCustomEditorNameFromAppPath(appPath);

  if (!existsSync(appPath)) {
    return {
      valid: false,
      appName: suggestedName
    };
  }

  if (
    isUnsupportedCustomEditorApp({
      appPath,
      suggestedName
    })
  ) {
    return {
      valid: false,
      appName: suggestedName
    };
  }

  return { valid: true };
}
