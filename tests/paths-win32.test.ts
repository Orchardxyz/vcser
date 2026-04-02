import { describe, it, expect } from "bun:test";
import { resolveSettingsPath, resolveExtensionsPath } from "../src/platform/paths.js";
import { join } from "node:path";
import { homedir } from "node:os";

describe("Cross-platform path resolution", () => {
  const home = homedir();

  it("resolves darwin settings path", () => {
    const result = resolveSettingsPath("darwin", "Code");
    expect(result).toBe(
      join(home, "Library", "Application Support", "Code", "User", "settings.json")
    );
  });

  it("resolves linux settings path", () => {
    const result = resolveSettingsPath("linux", "Code");
    expect(result).toBe(join(home, ".config", "Code", "User", "settings.json"));
  });

  it("resolves win32 settings path", () => {
    const appData = process.env.APPDATA || join(home, "AppData", "Roaming");
    const result = resolveSettingsPath("win32", "Code");
    expect(result).toBe(join(appData, "Code", "User", "settings.json"));
  });

  it("resolves extensions path", () => {
    const result = resolveExtensionsPath("darwin", ".vscode");
    expect(result).toBe(join(home, ".vscode", "extensions"));
  });
});
