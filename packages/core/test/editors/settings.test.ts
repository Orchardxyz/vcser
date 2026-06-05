import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  diffSettings,
  filterSettingsDiffsByExtensionNamespaces,
  groupSettingsByNamespace,
  namespaceOf,
  orientSettingsDiffsForSourceTargetSync,
  readSettingsJson,
  readSettingsJsonFile,
  syncSettingsValues
} from "../../src/editors/settings";
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

describe("filterSettingsDiffsByExtensionNamespaces", () => {
  it("keeps only diffs whose namespaces belong to the selected extensions", () => {
    const diffs = [
      { key: "python.analysis.typeCheckingMode", changeType: CHANGE_TYPE.UPDATE, sourceValue: "basic", targetValue: "off" },
      { key: "prettier.printWidth", changeType: CHANGE_TYPE.ADD, sourceValue: 100, targetValue: undefined },
      { key: "editor.fontSize", changeType: CHANGE_TYPE.UPDATE, sourceValue: 14, targetValue: 12 }
    ];

    const filtered = filterSettingsDiffsByExtensionNamespaces({
      diffs,
      extensionIds: ["ms-python.python"],
      namespaceToExtension: new Map([
        ["python", "ms-python.python"],
        ["prettier", "esbenp.prettier-vscode"]
      ])
    });

    expect(filtered).toEqual([diffs[0]]);
  });
});

describe("orientSettingsDiffsForSourceTargetSync", () => {
  it("flips add and delete semantics for source-to-target sync application", () => {
    const diffs = orientSettingsDiffsForSourceTargetSync([
      { key: "python.analysis.typeCheckingMode", changeType: CHANGE_TYPE.UPDATE, sourceValue: "basic", targetValue: "off" },
      { key: "prettier.printWidth", changeType: CHANGE_TYPE.ADD, sourceValue: undefined, targetValue: 100 },
      { key: "python.analysis.autoImportCompletions", changeType: CHANGE_TYPE.DELETE, sourceValue: false, targetValue: undefined }
    ]);

    expect(diffs).toEqual([
      { key: "python.analysis.typeCheckingMode", changeType: CHANGE_TYPE.UPDATE, sourceValue: "basic", targetValue: "off" },
      { key: "prettier.printWidth", changeType: CHANGE_TYPE.DELETE, sourceValue: undefined, targetValue: 100 },
      { key: "python.analysis.autoImportCompletions", changeType: CHANGE_TYPE.ADD, sourceValue: false, targetValue: undefined }
    ]);
  });
});

describe("readSettingsJsonFile", () => {
  it("can treat a missing file as an empty settings object", () => {
    const result = readSettingsJsonFile(join(tmpdir(), `vcser-missing-${Date.now()}.json`), { missingAsEmpty: true });

    expect(result).toEqual({
      success: true,
      exists: false,
      settings: {}
    });
  });
});

describe("syncSettingsValues", () => {
  let tmpDir: string;
  let settingsPath: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "vcser-settings-sync-test-"));
    settingsPath = join(tmpDir, "settings.json");
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("applies add, update, and delete diffs while preserving unrelated settings", () => {
    writeFileSync(
      settingsPath,
      `{
  // Keep comment
  "python.analysis.typeCheckingMode": "off",
  "python.analysis.autoImportCompletions": false,
  "window.zoomLevel": 1
}\n`
    );

    const result = syncSettingsValues({
      targetSettingsPath: settingsPath,
      diffs: [
        {
          key: "python.analysis.typeCheckingMode",
          changeType: CHANGE_TYPE.UPDATE,
          sourceValue: "basic",
          targetValue: "off"
        },
        {
          key: "python.analysis.extraPaths",
          changeType: CHANGE_TYPE.ADD,
          sourceValue: ["src"],
          targetValue: undefined
        },
        {
          key: "python.analysis.autoImportCompletions",
          changeType: CHANGE_TYPE.DELETE,
          sourceValue: undefined,
          targetValue: false
        }
      ]
    });

    expect(result.success).toBe(true);
    expect(result.appliedCount).toBe(3);
    expect(result.backupPath).toBeDefined();
    expect(existsSync(result.backupPath!)).toBe(true);
    expect(readFileSync(result.backupPath!, "utf-8")).toContain('"python.analysis.autoImportCompletions": false');

    const updatedText = readFileSync(settingsPath, "utf-8");
    expect(updatedText).toContain("// Keep comment");

    const updated = readSettingsJson(settingsPath);
    expect(updated).toEqual({
      "python.analysis.typeCheckingMode": "basic",
      "python.analysis.extraPaths": ["src"],
      "window.zoomLevel": 1
    });
  });

  it("creates a missing target settings file without a backup", () => {
    const missingTargetPath = join(tmpDir, "missing-settings.json");

    const result = syncSettingsValues({
      targetSettingsPath: missingTargetPath,
      diffs: [
        {
          key: "prettier.printWidth",
          changeType: CHANGE_TYPE.ADD,
          sourceValue: 100,
          targetValue: undefined
        }
      ]
    });

    expect(result).toMatchObject({
      success: true,
      appliedCount: 1,
      backupPath: undefined
    });
    expect(readSettingsJson(missingTargetPath)).toEqual({
      "prettier.printWidth": 100
    });
  });

  it("fails without clobbering the target when the target JSONC is invalid", () => {
    writeFileSync(settingsPath, "{ invalid json }");
    const original = readFileSync(settingsPath, "utf-8");

    const result = syncSettingsValues({
      targetSettingsPath: settingsPath,
      diffs: [
        {
          key: "python.analysis.typeCheckingMode",
          changeType: CHANGE_TYPE.UPDATE,
          sourceValue: "basic",
          targetValue: "off"
        }
      ]
    });

    expect(result.success).toBe(false);
    expect(result.appliedCount).toBe(0);
    expect(readFileSync(settingsPath, "utf-8")).toBe(original);
  });
});
