import { homedir } from "node:os";
import { join } from "node:path";

export type Platform = "darwin" | "linux" | "win32";

export function currentPlatform(): Platform {
  const p = process.platform;
  if (p === "darwin" || p === "linux" || p === "win32") return p;
  return "linux";
}

export function homeDir(): string {
  return homedir();
}

export function settingsBase(platform: Platform): string {
  const home = homeDir();
  switch (platform) {
    case "darwin":
      return join(home, "Library", "Application Support");
    case "linux":
      return join(home, ".config");
    case "win32":
      return process.env.APPDATA || join(home, "AppData", "Roaming");
  }
}

export function extensionsBase(platform: Platform): string {
  return homeDir();
}

export function resolveSettingsPath(
  platform: Platform,
  appName: string
): string {
  return join(settingsBase(platform), appName, "User", "settings.json");
}

export function resolveExtensionsPath(
  platform: Platform,
  dotDir: string
): string {
  return join(extensionsBase(platform), dotDir, "extensions");
}

export function normalizePath(p: string): string {
  return p.replace(/\\/g, "/");
}
