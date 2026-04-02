import { describe, it, expect } from "bun:test";
import { runPreflight, allReady } from "../src/preflight/checks.js";
import type { ResolvedEditor } from "../src/editors/types.js";

function mockEditor(overrides: Partial<ResolvedEditor> = {}): ResolvedEditor {
  return {
    name: "TestEditor",
    slug: "test",
    cli: "test-cli",
    badgeColor: "blue",
    extensionsPath: "/nonexistent/extensions",
    settingsPath: "/nonexistent/settings.json",
    cliAvailable: true,
    extensionsExist: true,
    settingsExist: true,
    ...overrides,
  };
}

describe("Preflight checks", () => {
  it("reports ready when all paths exist", () => {
    const results = runPreflight([mockEditor()]);
    expect(results[0]!.ready).toBe(true);
    expect(results[0]!.warnings).toHaveLength(0);
  });

  it("warns when extensions dir missing", () => {
    const results = runPreflight([mockEditor({ extensionsExist: false })]);
    expect(results[0]!.warnings.length).toBeGreaterThan(0);
    expect(results[0]!.warnings[0]).toContain("Extensions directory");
  });

  it("warns when CLI not available", () => {
    const results = runPreflight([mockEditor({ cliAvailable: false })]);
    expect(results[0]!.warnings.some((w) => w.includes("CLI"))).toBe(true);
  });

  it("marks not ready when both paths missing", () => {
    const results = runPreflight([
      mockEditor({ extensionsExist: false, settingsExist: false }),
    ]);
    expect(results[0]!.ready).toBe(false);
  });

  it("allReady returns true when all editors ready", () => {
    const results = runPreflight([mockEditor(), mockEditor({ name: "B" })]);
    expect(allReady(results)).toBe(true);
  });
});
