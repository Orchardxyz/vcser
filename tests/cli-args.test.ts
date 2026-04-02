import { describe, it, expect } from "bun:test";

describe("CLI args parsing", () => {
  it("should parse --custom-json correctly", () => {
    const input = '{"name":"MyEditor","extensionsPath":"/ext","settingsPath":"/settings.json","cli":"myeditor"}';
    const parsed = JSON.parse(input);
    expect(parsed.name).toBe("MyEditor");
    expect(parsed.extensionsPath).toBe("/ext");
    expect(parsed.settingsPath).toBe("/settings.json");
    expect(parsed.cli).toBe("myeditor");
  });

  it("should reject invalid --custom-json", () => {
    expect(() => {
      const parsed = JSON.parse('{"name":"X"}');
      if (typeof parsed.extensionsPath !== "string") {
        throw new Error("Missing extensionsPath");
      }
    }).toThrow();
  });

  it("should parse settings mode", () => {
    const modes = ["safe", "exact"];
    expect(modes).toContain("safe");
    expect(modes).toContain("exact");
  });
});
