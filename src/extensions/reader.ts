import { execSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import type { ResolvedEditor } from "../editors/types";

export interface ExtensionInfo {
  id: string;
  source: "cli" | "dir-scan";
}

export interface EditorExtensions {
  editor: ResolvedEditor;
  extensions: ExtensionInfo[];
}

function readViaCli(cli: string): ExtensionInfo[] | null {
  try {
    const output = execSync(`${cli} --list-extensions`, {
      encoding: "utf-8",
      timeout: 15000,
      stdio: ["ignore", "pipe", "ignore"],
    });
    return output
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((id) => ({ id: id.toLowerCase(), source: "cli" as const }));
  } catch {
    return null;
  }
}

function readViaDirScan(extensionsPath: string): ExtensionInfo[] | null {
  if (!existsSync(extensionsPath)) return null;

  try {
    const entries = readdirSync(extensionsPath, { withFileTypes: true });
    return entries
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .filter((name) => !name.startsWith("."))
      .map((name) => {
        const match = name.match(/^(.+?)-\d+\.\d+\.\d+/);
        const id = match ? match[1] : name;
        return { id: id.toLowerCase(), source: "dir-scan" as const };
      })
      .filter(
        (ext, i, arr) => arr.findIndex((e) => e.id === ext.id) === i
      );
  } catch {
    return null;
  }
}

export function readExtensions(editor: ResolvedEditor): EditorExtensions {
  if (editor.cliAvailable) {
    const cliResult = readViaCli(editor.cli);
    if (cliResult && cliResult.length > 0) {
      return { editor, extensions: cliResult };
    }
  }

  const dirResult = readViaDirScan(editor.extensionsPath);
  if (dirResult) {
    return { editor, extensions: dirResult };
  }

  return { editor, extensions: [] };
}

export function readAllExtensions(
  editors: ResolvedEditor[]
): EditorExtensions[] {
  return editors.map(readExtensions);
}
