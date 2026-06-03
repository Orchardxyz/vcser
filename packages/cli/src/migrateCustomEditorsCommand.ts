import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { promisify } from "node:util";
import {
  createUniqueCustomSlug,
  findConflict,
  listCustomEditors,
  normalizeOptionalString,
  normalizeRequiredString,
  normalizeCustomEditorInput,
  resolveCustomEditorStorePath,
  CUSTOM_EDITOR_STORE_VERSION,
  type CustomEditorConflictCandidate
} from "@vcser/core/customEditors";
import { hasErrorCode, NODE_ERROR_CODE } from "@vcser/core/errors";
import type { CustomEditorRecord } from "@vcser/core/types";
import { resolveDatabasePathFromUrl, resolveDatabaseUrl } from "@vcser/core/dataPaths";
import type { CliLogger } from "./logger";

const execFilePromise = promisify(execFile);

interface LegacyCustomEditorRow {
  id?: unknown;
  slug?: unknown;
  name?: unknown;
  displayName?: unknown;
  cli?: unknown;
  appPath?: unknown;
  extensionsPath?: unknown;
  settingsPath?: unknown;
  createdAt?: unknown;
}

function toConflictCandidates(editors: readonly CustomEditorRecord[]): CustomEditorConflictCandidate[] {
  return editors.map((editor) => ({
    id: editor.id,
    slug: editor.slug,
    name: editor.name,
    displayName: editor.displayName,
    extensionsPath: editor.extensionsPath,
    settingsPath: editor.settingsPath
  }));
}

function sortCustomEditors(editors: readonly CustomEditorRecord[]): CustomEditorRecord[] {
  return [...editors].sort((left, right) => {
    const leftTime = Date.parse(left.createdAt);
    const rightTime = Date.parse(right.createdAt);

    if (Number.isFinite(leftTime) && Number.isFinite(rightTime) && leftTime !== rightTime) {
      return leftTime - rightTime;
    }

    return left.slug.localeCompare(right.slug);
  });
}

function isLegacyCustomEditorRow(value: unknown): value is LegacyCustomEditorRow {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function normalizeLegacyCustomEditorRow(row: LegacyCustomEditorRow): CustomEditorRecord | undefined {
  const id = typeof row.id === "string" ? normalizeRequiredString(row.id) : "";
  const slug = typeof row.slug === "string" ? normalizeRequiredString(row.slug) : "";
  const name = typeof row.name === "string" ? normalizeRequiredString(row.name) : "";
  const displayNameSource = typeof row.displayName === "string" ? row.displayName : row.name;
  const displayName = typeof displayNameSource === "string" ? normalizeRequiredString(displayNameSource) : "";
  const extensionsPath = typeof row.extensionsPath === "string" ? normalizeRequiredString(row.extensionsPath) : "";
  const settingsPath = typeof row.settingsPath === "string" ? normalizeRequiredString(row.settingsPath) : "";
  const createdAt = typeof row.createdAt === "string" ? normalizeRequiredString(row.createdAt) : "";

  if (!id || !slug || !name || !displayName || !extensionsPath || !settingsPath || !createdAt) {
    return undefined;
  }

  if (Number.isNaN(Date.parse(createdAt))) {
    return undefined;
  }

  return {
    id,
    slug,
    name,
    displayName,
    cli: typeof row.cli === "string" ? normalizeOptionalString(row.cli) : undefined,
    appPath: typeof row.appPath === "string" ? normalizeOptionalString(row.appPath) : undefined,
    extensionsPath,
    settingsPath,
    createdAt
  };
}

async function runSqlite(databasePath: string, sql: string): Promise<string> {
  const { stdout } = await execFilePromise("sqlite3", [databasePath, sql], {
    windowsHide: true,
    maxBuffer: 10 * 1024 * 1024
  });

  return stdout;
}

async function ensureSqlite3Available(): Promise<void> {
  try {
    await execFilePromise("sqlite3", ["-version"], {
      windowsHide: true,
      maxBuffer: 1024 * 1024
    });
  } catch (error) {
    if (hasErrorCode(error, NODE_ERROR_CODE.ENOENT)) {
      throw new Error("The sqlite3 command is required to migrate legacy custom editors.", { cause: error });
    }

    throw error;
  }
}

async function hasLegacyCustomEditorTable(databasePath: string): Promise<boolean> {
  const stdout = await runSqlite(databasePath, "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'CustomEditor' LIMIT 1;");

  return stdout.trim() === "1";
}

async function readLegacyCustomEditors(databasePath: string): Promise<LegacyCustomEditorRow[]> {
  const stdout = await runSqlite(
    databasePath,
    `SELECT json_object(
      'id', id,
      'slug', slug,
      'name', name,
      'displayName', displayName,
      'cli', cli,
      'appPath', appPath,
      'extensionsPath', extensionsPath,
      'settingsPath', settingsPath,
      'createdAt', createdAt
    )
    FROM "CustomEditor"
    ORDER BY createdAt ASC;`
  );

  return stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as unknown)
    .filter(isLegacyCustomEditorRow);
}

async function writeMergedCustomEditors(editors: readonly CustomEditorRecord[]): Promise<void> {
  const storePath = resolveCustomEditorStorePath();
  const directoryPath = dirname(storePath);
  const tempPath = `${storePath}.${randomUUID()}.tmp`;
  const contents = JSON.stringify(
    {
      version: CUSTOM_EDITOR_STORE_VERSION,
      editors: sortCustomEditors(editors)
    },
    null,
    2
  );

  try {
    await mkdir(directoryPath, { recursive: true });
    await writeFile(tempPath, `${contents}\n`, "utf8");
    await rename(tempPath, storePath);
  } finally {
    await rm(tempPath, { force: true }).catch(() => undefined);
  }
}

async function cleanupLegacyCustomEditorTable(databasePath: string): Promise<void> {
  await runSqlite(databasePath, 'DELETE FROM "CustomEditor";');
}

export async function runMigrateCustomEditorsCommand(logger: CliLogger): Promise<number> {
  await ensureSqlite3Available();

  const databaseUrl = resolveDatabaseUrl();
  const databasePath = resolveDatabasePathFromUrl(databaseUrl);

  if (!databasePath) {
    throw new Error(`Legacy custom editor migration only supports file-based SQLite databases. Current DATABASE_URL: ${databaseUrl}`);
  }

  if (!(await hasLegacyCustomEditorTable(databasePath))) {
    logger.line(logger.palette.yellow(`No legacy CustomEditor table found in ${databasePath}.`));
    return 0;
  }

  const existingEditors = await listCustomEditors();
  const legacyRows = await readLegacyCustomEditors(databasePath);
  const mergedEditors = [...existingEditors];
  const usedIds = new Set(existingEditors.map((editor) => editor.id));
  const usedSlugs = new Set(existingEditors.map((editor) => editor.slug));
  let importedCount = 0;
  let duplicateCount = 0;
  let invalidCount = 0;

  for (const row of legacyRows) {
    const normalizedRow = normalizeLegacyCustomEditorRow(row);

    if (!normalizedRow) {
      invalidCount += 1;
      continue;
    }

    const conflict = findConflict(normalizeCustomEditorInput(normalizedRow), toConflictCandidates(mergedEditors));

    if (conflict) {
      duplicateCount += 1;
      continue;
    }

    const id = usedIds.has(normalizedRow.id) ? randomUUID() : normalizedRow.id;
    const slug = usedSlugs.has(normalizedRow.slug) ? createUniqueCustomSlug(normalizedRow.name, usedSlugs) : normalizedRow.slug;

    mergedEditors.push({
      ...normalizedRow,
      id,
      slug
    });
    usedIds.add(id);
    usedSlugs.add(slug);
    importedCount += 1;
  }

  if (importedCount === 0 && invalidCount > 0) {
    throw new Error("Legacy custom editor migration found only invalid rows. The legacy table was left unchanged.");
  }

  await writeMergedCustomEditors(mergedEditors);
  await cleanupLegacyCustomEditorTable(databasePath);

  logger.line(logger.palette.green(`Imported ${importedCount} legacy custom editor${importedCount === 1 ? "" : "s"}.`));

  if (duplicateCount > 0) {
    logger.line(logger.palette.yellow(`Skipped ${duplicateCount} duplicate legacy record${duplicateCount === 1 ? "" : "s"}.`));
  }

  if (invalidCount > 0) {
    logger.line(logger.palette.yellow(`Skipped ${invalidCount} invalid legacy row${invalidCount === 1 ? "" : "s"}.`));
  }

  logger.line(logger.palette.green(`Cleaned legacy CustomEditor rows from ${databasePath}.`));
  return 0;
}
