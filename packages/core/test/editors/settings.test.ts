import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { diffSettings, groupSettingsByNamespace, namespaceOf, readSettingsJson } from "../../src/editors/settings";
import { CHANGE_TYPE } from "../../src/shared/types";

describe("readSettingsJson", () => {
  let tmpDir: string;
  let settingsPath: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "vcser-settings-test-"));
    settingsPath = join(tmpDir, "settings.json");
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("parses valid JSON", () => {
    writeFileSync(settingsPath, JSON.stringify({ "editor.fontSize": 14, "workbench.colorTheme": "Dark" }));
    const result = readSettingsJson(settingsPath);
    expect(result).toEqual({ "editor.fontSize": 14, "workbench.colorTheme": "Dark" });
  });

  it("accepts comments and trailing commas", () => {
    writeFileSync(
      settingsPath,
      `{
  // This is a comment
  "editor.fontSize": 14,
  "workbench.colorTheme": "Dark",
}`
    );
    const result = readSettingsJson(settingsPath);
    expect(result).toEqual({ "editor.fontSize": 14, "workbench.colorTheme": "Dark" });
  });

  it("returns {} for malformed JSONC and logs a warning", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    writeFileSync(settingsPath, "{ invalid json }");
    const result = readSettingsJson(settingsPath);
    expect(result).toEqual({});
    expect(warnSpy).toHaveBeenCalledTimes(1);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const msg = warnSpy.mock.calls[0]?.[0];
    expect(msg).toContain("[vcser] Failed to parse settings file");
    expect(msg).toContain(settingsPath);
    warnSpy.mockRestore();
  });

  it("returns {} for missing files and logs a warning", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const result = readSettingsJson(join(tmpDir, "nonexistent.json"));
    expect(result).toEqual({});
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0]?.[0]).toContain("[vcser] Failed to parse settings file");
    warnSpy.mockRestore();
  });
});

describe("namespaceOf", () => {
  it("returns the segment before the first dot", () => {
    expect(namespaceOf("editor.fontSize")).toBe("editor");
    expect(namespaceOf("workbench.colorTheme")).toBe("workbench");
    expect(namespaceOf("terminal.integrated.shell.linux")).toBe("terminal");
  });

  it("returns the key itself when there is no dot", () => {
    expect(namespaceOf("editor")).toBe("editor");
  });
});

describe("diffSettings", () => {
  it("emits ADD for keys only in right", () => {
    const diffs = diffSettings({}, { newKey: "value" });
    expect(diffs).toEqual([{ key: "newKey", changeType: CHANGE_TYPE.ADD, sourceValue: undefined, targetValue: "value" }]);
  });

  it("emits DELETE for keys only in left", () => {
    const diffs = diffSettings({ oldKey: "value" }, {});
    expect(diffs).toEqual([{ key: "oldKey", changeType: CHANGE_TYPE.DELETE, sourceValue: "value", targetValue: undefined }]);
  });

  it("emits UPDATE for changed values", () => {
    const diffs = diffSettings({ key: "old" }, { key: "new" });
    expect(diffs).toEqual([{ key: "key", changeType: CHANGE_TYPE.UPDATE, sourceValue: "old", targetValue: "new" }]);
  });

  it("emits no diff for unchanged keys", () => {
    const diffs = diffSettings({ same: "value" }, { same: "value" });
    expect(diffs).toEqual([]);
  });

  it("handles a mix of add, delete, update, and unchanged", () => {
    const left = { unchanged: 1, updated: "left", deleted: true };
    const right = { unchanged: 1, updated: "right", added: 42 };
    const diffs = diffSettings(left, right);
    expect(diffs).toHaveLength(3);
    expect(diffs.find((d) => d.key === "added")?.changeType).toBe(CHANGE_TYPE.ADD);
    expect(diffs.find((d) => d.key === "updated")?.changeType).toBe(CHANGE_TYPE.UPDATE);
    expect(diffs.find((d) => d.key === "deleted")?.changeType).toBe(CHANGE_TYPE.DELETE);
  });

  it("returns sorted keys", () => {
    const diffs = diffSettings({ z: 1, a: 2 }, { c: 3 });
    const keys = diffs.map((d) => d.key);
    expect(keys).toEqual(["a", "c", "z"]);
  });
});

describe("groupSettingsByNamespace", () => {
  it("groups diffs and identical keys correctly", () => {
    const left = {
      "editor.fontSize": 14,
      "editor.lineHeight": 22,
      "workbench.colorTheme": "Dark"
    };
    const right = {
      "editor.fontSize": 16,
      "editor.lineHeight": 22,
      "workbench.iconTheme": "vs-seti"
    };

    const diffs = diffSettings(left, right);
    const grouped = groupSettingsByNamespace(left, right, diffs);

    const editorGroup = grouped.get("editor");
    expect(editorGroup).toBeDefined();
    expect(editorGroup!.totalCount).toBe(2);
    expect(editorGroup!.identicalCount).toBe(1);
    expect(editorGroup!.diffs).toHaveLength(1);
    expect(editorGroup!.diffs[0]!.key).toBe("editor.fontSize");

    const workbenchGroup = grouped.get("workbench");
    expect(workbenchGroup).toBeDefined();
    expect(workbenchGroup!.totalCount).toBe(2);
    expect(workbenchGroup!.identicalCount).toBe(0);
    expect(workbenchGroup!.diffs).toHaveLength(2);
  });
});
