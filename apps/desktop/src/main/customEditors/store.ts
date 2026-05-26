import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { app } from "electron";
import {
  appendCustomEditor,
  CustomEditorStoreError,
  findCustomEditorByIdOrSlug,
  initializeCustomEditorStorage,
  isCustomEditorRecord,
  listCustomEditors,
  removeCustomEditor,
  updateCustomEditor
} from "@vcser/core/customEditors";
import type { CustomEditorRecord } from "@vcser/core/types";

interface CustomEditorsFile {
  editors: CustomEditorRecord[];
}

let ensureInitializedPromise: Promise<void> | null = null;

function resolveCustomEditorsFilePath() {
  return join(app.getPath("userData"), "custom-editors.json");
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

function isLegacyCodeBuddySeed(editor: CustomEditorRecord) {
  const seed = resolveCodeBuddySeed();

  return (
    editor.slug === seed.slug &&
    editor.name === seed.name &&
    editor.displayName === seed.displayName &&
    editor.appPath === seed.appPath &&
    editor.extensionsPath === seed.extensionsPath &&
    editor.settingsPath === seed.settingsPath
  );
}

async function cleanupLegacyCodeBuddySeed() {
  const editor = await findCustomEditorByIdOrSlug("custom-codebuddy");
  if (!editor || !isLegacyCodeBuddySeed(editor)) {
    return;
  }

  await removeCustomEditor(editor.id);
}

async function ensureDesktopCustomEditorsInitialized(): Promise<void> {
  if (ensureInitializedPromise) {
    return ensureInitializedPromise;
  }

  ensureInitializedPromise = initializeCustomEditorStorage({
    legacyEditors: readCustomEditorsFile().editors
  });

  try {
    await ensureInitializedPromise;
    await cleanupLegacyCodeBuddySeed();
  } catch (error) {
    ensureInitializedPromise = null;
    throw error;
  }
}

export { CustomEditorStoreError, findCustomEditorByIdOrSlug };

export async function listDesktopCustomEditors() {
  await ensureDesktopCustomEditorsInitialized();
  return listCustomEditors();
}

export async function appendDesktopCustomEditor(...args: Parameters<typeof appendCustomEditor>) {
  await ensureDesktopCustomEditorsInitialized();
  return appendCustomEditor(...args);
}

export async function updateDesktopCustomEditor(...args: Parameters<typeof updateCustomEditor>) {
  await ensureDesktopCustomEditorsInitialized();
  return updateCustomEditor(...args);
}

export async function removeDesktopCustomEditor(...args: Parameters<typeof removeCustomEditor>) {
  await ensureDesktopCustomEditorsInitialized();
  return removeCustomEditor(...args);
}
