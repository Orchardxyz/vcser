import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { APP_LOCALE } from "@vcser/core/i18n";
import { APP_ICON_STATUS, CHANGE_TYPE, EDITOR_SOURCE, type SettingsKeyDiff } from "@vcser/core/types";
import { createCliI18n } from "../src/locales/i18n";
import type { CliLogger } from "../src/logger";
import type { CliEditor } from "../src/editor/resolution";
import { runWizard } from "../src/sync/wizard";

const i18n = createCliI18n(APP_LOCALE.EN);

const {
  canRunCommandMock,
  createPromptRunnerMock,
  diffSettingsMock,
  filterSettingsDiffsByExtensionNamespacesMock,
  listEditorExtensionsMock,
  orientSettingsDiffsForSourceTargetSyncMock,
  readSettingsJsonFileMock,
  resolveCliEditorsMock,
  resolveNamespacesToExtensionsMock,
  syncExtensionLocalMock,
  syncSettingsValuesMock
} = vi.hoisted(() => ({
  canRunCommandMock: vi.fn(),
  createPromptRunnerMock: vi.fn(),
  diffSettingsMock: vi.fn(),
  filterSettingsDiffsByExtensionNamespacesMock: vi.fn(),
  listEditorExtensionsMock: vi.fn(),
  orientSettingsDiffsForSourceTargetSyncMock: vi.fn(),
  readSettingsJsonFileMock: vi.fn(),
  resolveCliEditorsMock: vi.fn(),
  resolveNamespacesToExtensionsMock: vi.fn(),
  syncExtensionLocalMock: vi.fn(),
  syncSettingsValuesMock: vi.fn()
}));

vi.mock("../src/editor/resolution", () => ({
  canRunCommand: canRunCommandMock,
  resolveCliEditors: resolveCliEditorsMock
}));

vi.mock("../src/prompt", () => ({
  createPromptRunner: createPromptRunnerMock
}));

vi.mock("@vcser/core/editors/extensions", () => ({
  listEditorExtensions: listEditorExtensionsMock,
  resolveNamespacesToExtensions: resolveNamespacesToExtensionsMock,
  syncExtensionLocal: syncExtensionLocalMock
}));

vi.mock("@vcser/core/editors/settings", () => ({
  diffSettings: diffSettingsMock,
  filterSettingsDiffsByExtensionNamespaces: filterSettingsDiffsByExtensionNamespacesMock,
  namespaceOf: (key: string) => key.split(".")[0] ?? key,
  orientSettingsDiffsForSourceTargetSync: orientSettingsDiffsForSourceTargetSyncMock,
  readSettingsJsonFile: readSettingsJsonFileMock,
  syncSettingsValues: syncSettingsValuesMock
}));

vi.mock("ora", () => ({
  default: () => ({
    start() {
      return {
        stop() {},
        text: ""
      };
    }
  })
}));

function createEditor(overrides: Partial<CliEditor>): CliEditor {
  return {
    name: overrides.name ?? "Visual Studio Code",
    displayName: overrides.displayName ?? "Visual Studio Code",
    slug: overrides.slug ?? "vscode",
    cli: overrides.cli ?? "code",
    badgeColor: overrides.badgeColor ?? "blue",
    extensionsPath: overrides.extensionsPath ?? `/tmp/${overrides.slug ?? "vscode"}/extensions`,
    settingsPath: overrides.settingsPath ?? `/tmp/${overrides.slug ?? "vscode"}/settings.json`,
    cliAvailable: overrides.cliAvailable ?? true,
    extensionsExist: overrides.extensionsExist ?? true,
    settingsExist: overrides.settingsExist ?? true,
    iconStatus: overrides.iconStatus ?? APP_ICON_STATUS.FALLBACK,
    source: overrides.source ?? EDITOR_SOURCE.DETECTED,
    stateDbPath: overrides.stateDbPath,
    id: overrides.id,
    appPath: overrides.appPath,
    iconPayload: overrides.iconPayload
  };
}

function createPromptQueue(responses: Array<Record<string, unknown>>) {
  return async () => {
    const next = responses.shift();

    if (!next) {
      throw new Error("Unexpected prompt invocation.");
    }

    return next;
  };
}

function createTestLogger() {
  const lines: string[] = [];
  const errors: string[] = [];
  const tables: Array<{ columns: ReadonlyArray<{ key: string; label: string; maxWidth?: number }>; rows: ReadonlyArray<Record<string, string>> }> =
    [];
  const passthrough = (value: string) => value;

  const logger = {
    palette: {
      brand: passthrough,
      cyan: passthrough,
      dim: passthrough,
      green: passthrough,
      red: passthrough,
      yellow: passthrough
    },
    banner() {},
    line(message = "") {
      lines.push(message);
    },
    error(message: string) {
      errors.push(message);
    },
    debug() {},
    inventorySummary() {},
    syncSummary() {},
    table(params) {
      tables.push(params);
    },
    settingsSyncApplied(params: { appliedCount: number; backupPath?: string }) {
      lines.push(`Settings applied: ${params.appliedCount}`);

      if (params.backupPath) {
        lines.push(`Backup: ${params.backupPath}`);
      }
    }
  } satisfies CliLogger;

  return { logger, lines, errors, tables };
}

describe("runWizard settings follow-up", () => {
  beforeEach(() => {
    canRunCommandMock.mockResolvedValue(true);
    resolveCliEditorsMock.mockResolvedValue([
      createEditor({ slug: "vscode", displayName: "Visual Studio Code", name: "Visual Studio Code" }),
      createEditor({ slug: "cursor", displayName: "Cursor", name: "Cursor" })
    ]);
    listEditorExtensionsMock.mockReset();
    syncExtensionLocalMock.mockReset();
    readSettingsJsonFileMock.mockReset();
    diffSettingsMock.mockReset();
    filterSettingsDiffsByExtensionNamespacesMock.mockReset();
    orientSettingsDiffsForSourceTargetSyncMock.mockReset();
    resolveNamespacesToExtensionsMock.mockReset();
    syncSettingsValuesMock.mockReset();
    orientSettingsDiffsForSourceTargetSyncMock.mockImplementation((diffs: SettingsKeyDiff[]): SettingsKeyDiff[] => diffs);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("skips settings sync when no extension sync succeeds", async () => {
    createPromptRunnerMock.mockReturnValue(
      createPromptQueue([
        { sourceSlug: "vscode" },
        { targetSlug: "cursor" },
        { viewMode: "missing" },
        { extensionIds: ["ms-python.python"] },
        { confirmed: true }
      ])
    );

    listEditorExtensionsMock
      .mockResolvedValueOnce([{ extensionId: "ms-python.python", version: "1.0.0", disabled: false }])
      .mockResolvedValueOnce([]);
    syncExtensionLocalMock.mockResolvedValue({
      action: "install",
      editor: "Cursor",
      extensionId: "ms-python.python",
      success: false,
      error: "failed"
    });

    const { logger, tables } = createTestLogger();
    await expect(runWizard(logger, i18n)).resolves.toBe(1);
    expect(resolveNamespacesToExtensionsMock).not.toHaveBeenCalled();
    expect(syncSettingsValuesMock).not.toHaveBeenCalled();
    expect(tables).toEqual([]);
  });

  it("skips the settings prompt when no scoped diffs exist", async () => {
    createPromptRunnerMock.mockReturnValue(
      createPromptQueue([
        { sourceSlug: "vscode" },
        { targetSlug: "cursor" },
        { viewMode: "missing" },
        { extensionIds: ["ms-python.python"] },
        { confirmed: true }
      ])
    );

    listEditorExtensionsMock
      .mockResolvedValueOnce([{ extensionId: "ms-python.python", version: "1.0.0", disabled: false }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ extensionId: "ms-python.python", version: "1.0.0", disabled: false }]);
    syncExtensionLocalMock.mockResolvedValue({
      action: "install",
      editor: "Cursor",
      extensionId: "ms-python.python",
      success: true
    });
    readSettingsJsonFileMock
      .mockReturnValueOnce({ success: true, exists: true, settings: { "python.analysis.typeCheckingMode": "basic" } })
      .mockReturnValueOnce({ success: true, exists: false, settings: {} });
    resolveNamespacesToExtensionsMock.mockResolvedValue({
      namespaceToExtension: new Map([["python", "ms-python.python"]])
    });
    diffSettingsMock.mockReturnValue([
      {
        key: "python.analysis.typeCheckingMode",
        changeType: CHANGE_TYPE.UPDATE,
        sourceValue: "basic",
        targetValue: "basic"
      }
    ]);
    filterSettingsDiffsByExtensionNamespacesMock.mockReturnValue([]);

    const { logger, lines } = createTestLogger();
    await expect(runWizard(logger, i18n)).resolves.toBe(0);
    expect(lines).toContain("No extension settings differences found for the synced extensions.");
    expect(syncSettingsValuesMock).not.toHaveBeenCalled();
    expect(readSettingsJsonFileMock).toHaveBeenNthCalledWith(2, "/tmp/cursor/settings.json", { missingAsEmpty: true });
  });

  it("offers settings sync only for extension sync successes after partial failures", async () => {
    createPromptRunnerMock.mockReturnValue(
      createPromptQueue([
        { sourceSlug: "vscode" },
        { targetSlug: "cursor" },
        { viewMode: "missing" },
        { extensionIds: ["ms-python.python", "esbenp.prettier-vscode"] },
        { confirmed: true },
        { confirmed: true }
      ])
    );

    listEditorExtensionsMock
      .mockResolvedValueOnce([
        { extensionId: "ms-python.python", version: "1.0.0", disabled: false },
        { extensionId: "esbenp.prettier-vscode", version: "2.0.0", disabled: false }
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ extensionId: "ms-python.python", version: "1.0.0", disabled: false }]);
    syncExtensionLocalMock
      .mockResolvedValueOnce({
        action: "install",
        editor: "Cursor",
        extensionId: "ms-python.python",
        success: true
      })
      .mockResolvedValueOnce({
        action: "install",
        editor: "Cursor",
        extensionId: "esbenp.prettier-vscode",
        success: false,
        error: "failed"
      });
    readSettingsJsonFileMock
      .mockReturnValueOnce({ success: true, exists: true, settings: { "python.analysis.typeCheckingMode": "basic" } })
      .mockReturnValueOnce({ success: true, exists: true, settings: { "python.analysis.typeCheckingMode": "off", "prettier.printWidth": 120 } });
    resolveNamespacesToExtensionsMock.mockResolvedValue({
      namespaceToExtension: new Map([
        ["python", "ms-python.python"],
        ["prettier", "esbenp.prettier-vscode"]
      ])
    });
    diffSettingsMock.mockReturnValue([
      {
        key: "python.analysis.typeCheckingMode",
        changeType: CHANGE_TYPE.UPDATE,
        sourceValue: "basic",
        targetValue: "off"
      },
      {
        key: "prettier.printWidth",
        changeType: CHANGE_TYPE.ADD,
        sourceValue: undefined,
        targetValue: 120
      }
    ]);
    filterSettingsDiffsByExtensionNamespacesMock.mockImplementation(
      (params: { diffs: Array<{ key: string }>; extensionIds: string[]; namespaceToExtension: Map<string, string> }) =>
        params.diffs.filter((diff) => {
          const namespace = diff.key.split(".")[0] ?? diff.key;
          const extensionId = params.namespaceToExtension.get(namespace);
          return extensionId ? params.extensionIds.includes(extensionId) : false;
        })
    );
    syncSettingsValuesMock.mockReturnValue({
      success: true,
      appliedCount: 1,
      backupPath: "/tmp/cursor/settings.json.bak-20260604T120000Z"
    });

    orientSettingsDiffsForSourceTargetSyncMock.mockImplementation((diffs: Array<{ key: string }>) =>
      diffs.filter((diff) => diff.key === "python.analysis.typeCheckingMode").map((diff) => ({ ...diff, changeType: CHANGE_TYPE.UPDATE }))
    );

    const { logger, tables } = createTestLogger();
    await expect(runWizard(logger, i18n)).resolves.toBe(1);
    expect(resolveNamespacesToExtensionsMock).toHaveBeenCalledWith({
      extensionIds: ["ms-python.python"],
      extensionsPaths: ["/tmp/vscode/extensions", "/tmp/cursor/extensions"]
    });
    expect(tables).toHaveLength(1);
    expect(tables[0]?.rows).toEqual([
      {
        sourceExtension: "ms-python.python@1.0.0",
        targetExtension: "ms-python.python@1.0.0",
        namespace: "python",
        key: "python.analysis.typeCheckingMode",
        change: "update",
        sourceValue: '"basic"',
        targetValue: '"off"'
      }
    ]);
    expect(syncSettingsValuesMock).toHaveBeenCalledWith({
      targetSettingsPath: "/tmp/cursor/settings.json",
      diffs: [
        {
          key: "python.analysis.typeCheckingMode",
          changeType: CHANGE_TYPE.UPDATE,
          sourceValue: "basic",
          targetValue: "off"
        }
      ]
    });
    expect(orientSettingsDiffsForSourceTargetSyncMock).toHaveBeenCalledTimes(1);
  });

  it("treats a missing target settings file as empty and still applies sync", async () => {
    createPromptRunnerMock.mockReturnValue(
      createPromptQueue([
        { sourceSlug: "vscode" },
        { targetSlug: "cursor" },
        { viewMode: "missing" },
        { extensionIds: ["ms-python.python"] },
        { confirmed: true },
        { confirmed: true }
      ])
    );

    resolveCliEditorsMock.mockResolvedValue([
      createEditor({ slug: "vscode", displayName: "Visual Studio Code", name: "Visual Studio Code" }),
      createEditor({ slug: "cursor", displayName: "Cursor", name: "Cursor", settingsExist: false })
    ]);
    listEditorExtensionsMock
      .mockResolvedValueOnce([{ extensionId: "ms-python.python", version: "1.0.0", disabled: false }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ extensionId: "ms-python.python", version: "1.0.0", disabled: false }]);
    syncExtensionLocalMock.mockResolvedValue({
      action: "install",
      editor: "Cursor",
      extensionId: "ms-python.python",
      success: true
    });
    readSettingsJsonFileMock
      .mockReturnValueOnce({ success: true, exists: true, settings: { "python.analysis.typeCheckingMode": "basic" } })
      .mockReturnValueOnce({ success: true, exists: false, settings: {} });
    resolveNamespacesToExtensionsMock.mockResolvedValue({
      namespaceToExtension: new Map([["python", "ms-python.python"]])
    });
    diffSettingsMock.mockReturnValue([
      {
        key: "python.analysis.typeCheckingMode",
        changeType: CHANGE_TYPE.DELETE,
        sourceValue: "basic",
        targetValue: undefined
      }
    ]);
    filterSettingsDiffsByExtensionNamespacesMock.mockReturnValue([
      {
        key: "python.analysis.typeCheckingMode",
        changeType: CHANGE_TYPE.DELETE,
        sourceValue: "basic",
        targetValue: undefined
      }
    ]);
    orientSettingsDiffsForSourceTargetSyncMock.mockReturnValue([
      {
        key: "python.analysis.typeCheckingMode",
        changeType: CHANGE_TYPE.ADD,
        sourceValue: "basic",
        targetValue: undefined
      }
    ]);
    syncSettingsValuesMock.mockReturnValue({
      success: true,
      appliedCount: 1
    });

    const { logger } = createTestLogger();
    await expect(runWizard(logger, i18n)).resolves.toBe(0);
    expect(readSettingsJsonFileMock).toHaveBeenNthCalledWith(2, "/tmp/cursor/settings.json", { missingAsEmpty: true });
    expect(syncSettingsValuesMock).toHaveBeenCalledWith({
      targetSettingsPath: "/tmp/cursor/settings.json",
      diffs: [
        {
          key: "python.analysis.typeCheckingMode",
          changeType: CHANGE_TYPE.ADD,
          sourceValue: "basic",
          targetValue: undefined
        }
      ]
    });
  });
});
