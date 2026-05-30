import { homedir } from "node:os";
import { join } from "node:path";

export function resolveDefaultDatabasePath(): string {
  if (process.platform === "darwin") {
    return join(homedir(), "Library", "Application Support", "vcser", "data.db");
  }

  if (process.platform === "win32") {
    const appData = process.env.APPDATA?.trim();
    return join(appData || join(homedir(), "AppData", "Roaming"), "vcser", "data.db");
  }

  return join(homedir(), ".local", "share", "vcser", "data.db");
}

export function toSqliteFileUrl(filePath: string): string {
  return `file:${filePath.replaceAll("\\", "/")}`;
}

export function resolveDatabaseUrl(): string {
  return process.env.DATABASE_URL || toSqliteFileUrl(resolveDefaultDatabasePath());
}

export function resolveDatabasePathFromUrl(url: string): string | undefined {
  if (!url.startsWith("file:")) {
    return undefined;
  }

  const normalized = url.slice("file:".length).split(/[?#]/, 1)[0];
  if (!normalized) {
    return undefined;
  }

  if (process.platform === "win32" && normalized.startsWith("/") && /^[A-Za-z]:\//.test(normalized.slice(1))) {
    return normalized.slice(1);
  }

  return normalized;
}
