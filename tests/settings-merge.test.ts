import { describe, it, expect } from "bun:test";
import { applySettingsDiffs } from "../src/settings/merge.js";
import type { SettingsKeyDiff } from "../src/settings/diff.js";

describe("Settings merge", () => {
  it("applies add diffs in safe mode", () => {
    const target = { "editor.fontSize": 14 };
    const source = { "editor.fontSize": 14, "editor.tabSize": 2 };
    const diffs: SettingsKeyDiff[] = [
      { key: "editor.tabSize", changeType: "add", sourceValue: 2 },
    ];

    const result = applySettingsDiffs(target, source, diffs);
    expect(result["editor.tabSize"]).toBe(2);
    expect(result["editor.fontSize"]).toBe(14);
  });

  it("applies update diffs", () => {
    const target = { "editor.fontSize": 14 };
    const source = { "editor.fontSize": 16 };
    const diffs: SettingsKeyDiff[] = [
      {
        key: "editor.fontSize",
        changeType: "update",
        sourceValue: 16,
        targetValue: 14,
      },
    ];

    const result = applySettingsDiffs(target, source, diffs);
    expect(result["editor.fontSize"]).toBe(16);
  });

  it("applies delete diffs in exact mode", () => {
    const target = { "editor.fontSize": 14, "editor.theme": "dark" };
    const source = { "editor.fontSize": 14 };
    const diffs: SettingsKeyDiff[] = [
      {
        key: "editor.theme",
        changeType: "delete",
        targetValue: "dark",
      },
    ];

    const result = applySettingsDiffs(target, source, diffs);
    expect(result).not.toHaveProperty("editor.theme");
    expect(result["editor.fontSize"]).toBe(14);
  });

  it("does not modify when no diffs selected", () => {
    const target = { "editor.fontSize": 14 };
    const source = { "editor.fontSize": 16 };
    const result = applySettingsDiffs(target, source, []);
    expect(result["editor.fontSize"]).toBe(14);
  });
});
