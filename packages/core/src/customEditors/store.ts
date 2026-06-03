import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { hasErrorCode, NODE_ERROR_CODE } from "../errors.js";
import type { CustomEditorRecord } from "../shared/types.js";
import {
  CUSTOM_EDITOR_STORE_ERROR_CODE,
  CUSTOM_EDITOR_STORE_VERSION,
  CustomEditorStoreError,
  isCustomEditorsStoreData,
  normalizeOptionalString,
  normalizeRequiredString,
  resolveCustomEditorStorePath,
  type CustomEditorConflictCandidate,
  type CustomEditorsStoreData,
  type NormalizedCustomEditorInput
} from "./shared.js";

let mutationQueue = Promise.resolve();

function toStoreUnavailableError(): CustomEditorStoreError {
  return new CustomEditorStoreError(CUSTOM_EDITOR_STORE_ERROR_CODE.STORE_UNAVAILABLE, "Custom editor storage is unavailable.");
}

function normalizeStoredEditors(editors: readonly CustomEditorRecord[]): CustomEditorRecord[] {
  return [...editors].sort((left, right) => {
    const leftTime = Date.parse(left.createdAt);
    const rightTime = Date.parse(right.createdAt);

    if (Number.isFinite(leftTime) && Number.isFinite(rightTime) && leftTime !== rightTime) {
      return leftTime - rightTime;
    }

    return left.slug.localeCompare(right.slug);
  });
}

export function toConflictCandidates(editors: readonly CustomEditorRecord[], ignoredId?: string): CustomEditorConflictCandidate[] {
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

export async function readCustomEditorStoreData(): Promise<CustomEditorsStoreData> {
  const filePath = resolveCustomEditorStorePath();

  try {
    const raw = await readFile(filePath, "utf8");
    const parsed: unknown = JSON.parse(raw);

    if (!isCustomEditorsStoreData(parsed)) {
      throw toStoreUnavailableError();
    }

    return {
      version: CUSTOM_EDITOR_STORE_VERSION,
      editors: normalizeStoredEditors(parsed.editors)
    };
  } catch (error) {
    if (hasErrorCode(error, NODE_ERROR_CODE.ENOENT)) {
      return {
        version: CUSTOM_EDITOR_STORE_VERSION,
        editors: []
      };
    }

    if (error instanceof CustomEditorStoreError) {
      throw error;
    }

    throw toStoreUnavailableError();
  }
}

export async function listStoredCustomEditors(): Promise<CustomEditorRecord[]> {
  const store = await readCustomEditorStoreData();
  return store.editors;
}

export async function writeStoredCustomEditors(editors: readonly CustomEditorRecord[]): Promise<void> {
  const filePath = resolveCustomEditorStorePath();
  const directoryPath = dirname(filePath);
  const tempPath = join(directoryPath, `custom-editors.${process.pid}.${randomUUID()}.tmp`);
  const payload = JSON.stringify(
    {
      version: CUSTOM_EDITOR_STORE_VERSION,
      editors: normalizeStoredEditors(editors)
    } satisfies CustomEditorsStoreData,
    null,
    2
  );

  try {
    await mkdir(directoryPath, { recursive: true });
    await writeFile(tempPath, `${payload}\n`, "utf8");
    await rename(tempPath, filePath);
  } catch {
    try {
      await rm(tempPath, { force: true });
    } catch {
      // ignore cleanup failure
    }

    throw toStoreUnavailableError();
  }
}

export async function runCustomEditorStoreMutation<T>(task: () => Promise<T>): Promise<T> {
  const runTask = mutationQueue.then(task, task);
  mutationQueue = runTask.then(
    () => undefined,
    () => undefined
  );
  return runTask;
}

export function createStoredCustomEditorRecord(input: NormalizedCustomEditorInput, slug: string): CustomEditorRecord {
  return {
    id: randomUUID(),
    slug,
    name: normalizeRequiredString(input.name),
    displayName: normalizeRequiredString(input.displayName),
    cli: normalizeOptionalString(input.cli),
    appPath: normalizeOptionalString(input.appPath),
    extensionsPath: normalizeRequiredString(input.extensionsPath),
    settingsPath: normalizeRequiredString(input.settingsPath),
    createdAt: new Date().toISOString()
  };
}

export function updateStoredCustomEditorRecord(existing: CustomEditorRecord, input: NormalizedCustomEditorInput): CustomEditorRecord {
  return {
    ...existing,
    name: normalizeRequiredString(input.name),
    displayName: normalizeRequiredString(input.displayName),
    cli: normalizeOptionalString(input.cli),
    appPath: normalizeOptionalString(input.appPath),
    extensionsPath: normalizeRequiredString(input.extensionsPath),
    settingsPath: normalizeRequiredString(input.settingsPath)
  };
}
