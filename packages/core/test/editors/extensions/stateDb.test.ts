import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { readStateDatabaseValueMock, writeStateDatabaseValueMock } = vi.hoisted(() => ({
  readStateDatabaseValueMock: vi.fn<(stateDbPath: string, key: string) => string | undefined>(),
  writeStateDatabaseValueMock: vi.fn<(stateDbPath: string, key: string, value: string) => void>()
}));

vi.mock("../../../src/editors/extensions/stateDb", () => ({
  readStateDatabaseValue: readStateDatabaseValueMock,
  writeStateDatabaseValue: writeStateDatabaseValueMock
}));

import { computeExtensionDiff, listEditorExtensions, setEditorExtensionDisabled } from "../../../src/editors/extensions";

describe("state database extension helpers", () => {
  let tmpDir: string;
  let extensionsPath: string;
  let stateDbPath: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "vcser-state-db-test-"));
    extensionsPath = join(tmpDir, "extensions");
    stateDbPath = join(tmpDir, "User", "globalStorage", "state.vscdb");

    mkdirSync(extensionsPath, { recursive: true });
    mkdirSync(join(tmpDir, "User", "globalStorage"), { recursive: true });

    writeFileSync(
      join(extensionsPath, "extensions.json"),
      JSON.stringify([{ identifier: { id: "publisher.extension" }, version: "1.0.0", relativeLocation: "publisher.extension-1.0.0" }])
    );
    mkdirSync(join(extensionsPath, "publisher.extension-1.0.0"), { recursive: true });

    readStateDatabaseValueMock.mockReset();
    writeStateDatabaseValueMock.mockReset();
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("reads disabled extension state through the internal state database helper", async () => {
    readStateDatabaseValueMock.mockReturnValue('[{"id":"publisher.extension"}]');

    const items = await listEditorExtensions({
      extensionsPath,
      stateDbPath,
      includeIcons: false
    });

    expect(readStateDatabaseValueMock).toHaveBeenCalledWith(stateDbPath, "extensionsIdentifiers/disabled");
    expect(items).toEqual([
      {
        extensionId: "publisher.extension",
        version: "1.0.0",
        disabled: true,
        iconDataUrl: undefined
      }
    ]);
  });

  it("writes disabled extension updates back through the internal state database helper", () => {
    readStateDatabaseValueMock.mockReturnValue(undefined);

    const disabled = setEditorExtensionDisabled({
      stateDbPath,
      extensionId: "publisher.extension",
      disabled: true
    });

    expect(disabled).toBe(true);
    expect(writeStateDatabaseValueMock).toHaveBeenCalledWith(stateDbPath, "extensionsIdentifiers/disabled", '[{"id":"publisher.extension"}]');
  });

  it("treats helper read failures as best-effort in diff flows", async () => {
    readStateDatabaseValueMock.mockImplementation(() => {
      throw new Error("state db unavailable");
    });

    const diff = await computeExtensionDiff([
      {
        name: "Editor A",
        extensionsPath,
        stateDbPath
      },
      {
        name: "Editor B",
        extensionsPath
      }
    ]);

    expect(diff.all).toEqual([
      {
        extensionId: "publisher.extension",
        presence: {
          "Editor A": true,
          "Editor B": true
        },
        disabled: {
          "Editor A": false,
          "Editor B": false
        },
        versions: {
          "Editor A": "1.0.0",
          "Editor B": "1.0.0"
        },
        hasVersionMismatch: false,
        iconDataUrl: undefined
      }
    ]);
  });
});
