import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { app } from "electron";
import type { CustomEditorInput, CustomEditorRecord } from "@vcser/core/types";

interface CustomEditorsFile {
  editors: CustomEditorRecord[];
}

function resolveCustomEditorsFilePath() {
  return join(app.getPath("userData"), "custom-editors.json");
}

function isCustomEditorRecord(value: unknown): value is CustomEditorRecord {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function normalizeRequiredString(value: string) {
  return value.trim();
}

function normalizeOptionalString(value?: string) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
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

function writeCustomEditorsFile(file: CustomEditorsFile) {
  const filePath = resolveCustomEditorsFilePath();
  mkdirSync(app.getPath("userData"), { recursive: true });
  writeFileSync(filePath, JSON.stringify(file, null, 2));
}

export function listCustomEditors(): CustomEditorRecord[] {
  return readCustomEditorsFile().editors;
}

export function appendCustomEditor(input: CustomEditorInput, reservedSlugs: Iterable<string>): CustomEditorRecord {
  const file = readCustomEditorsFile();
  const normalizedName = normalizeRequiredString(input.name);
  const record: CustomEditorRecord = {
    id: randomUUID(),
    slug: createUniqueCustomSlug(normalizedName, [...reservedSlugs, ...file.editors.map((editor) => editor.slug)]),
    name: normalizedName,
    displayName: normalizedName,
    cli: normalizeOptionalString(input.cli),
    appPath: normalizeOptionalString(input.appPath),
    extensionsPath: normalizeRequiredString(input.extensionsPath),
    settingsPath: normalizeRequiredString(input.settingsPath),
    createdAt: new Date().toISOString()
  };

  file.editors.push(record);
  writeCustomEditorsFile(file);
  return record;
}
