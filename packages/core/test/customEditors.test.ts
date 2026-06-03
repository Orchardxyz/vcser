import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  appendCustomEditor,
  CUSTOM_EDITOR_STORE_ERROR_CODE,
  findCustomEditorByIdOrSlug,
  hasCustomEditorStoreErrorCode,
  listCustomEditors,
  removeCustomEditor,
  resolveCustomEditorStorePath,
  updateCustomEditor
} from "../src/customEditors";

describe("custom editor JSON store", () => {
  let tempHome: string;
  let originalHome: string | undefined;
  let storeDirPath: string;
  let storeFilePath: string;

  beforeEach(() => {
    originalHome = process.env.HOME;
    tempHome = mkdtempSync(join(tmpdir(), "vcser-custom-editors-"));
    process.env.HOME = tempHome;
    storeDirPath = join(tempHome, ".vcser");
    storeFilePath = resolveCustomEditorStorePath();
  });

  afterEach(() => {
    try {
      if (existsSync(storeDirPath)) {
        chmodSync(storeDirPath, 0o700);
      }
    } catch {
      // ignore cleanup permission reset failures
    }

    rmSync(tempHome, { recursive: true, force: true });

    if (originalHome === undefined) {
      delete process.env.HOME;
    } else {
      process.env.HOME = originalHome;
    }
  });

  it("treats a missing store file as an empty store", async () => {
    await expect(listCustomEditors()).resolves.toEqual([]);
    expect(existsSync(storeFilePath)).toBe(false);
  });

  it("reports invalid JSON as store unavailable without overwriting the file", async () => {
    mkdirSync(storeDirPath, { recursive: true });
    writeFileSync(storeFilePath, "{this is not valid json}\n", "utf8");

    await expect(listCustomEditors()).rejects.toSatisfy((error: unknown) =>
      hasCustomEditorStoreErrorCode(error, CUSTOM_EDITOR_STORE_ERROR_CODE.STORE_UNAVAILABLE)
    );
    expect(readFileSync(storeFilePath, "utf8")).toBe("{this is not valid json}\n");
  });

  it("supports add, list, find, update, and remove using the versioned JSON store format", async () => {
    const created = await appendCustomEditor({
      name: "Cursor",
      cli: "cursor",
      appPath: "/Applications/Cursor.app",
      extensionsPath: "/tmp/cursor/extensions",
      settingsPath: "/tmp/cursor/settings.json"
    });

    expect(created.slug).toBe("custom-cursor");

    const stored = JSON.parse(readFileSync(storeFilePath, "utf8")) as { version: number; editors: Array<{ slug: string }> };
    expect(stored.version).toBe(1);
    expect(stored.editors).toHaveLength(1);
    expect(stored.editors[0]?.slug).toBe("custom-cursor");

    await expect(listCustomEditors()).resolves.toEqual([created]);
    await expect(findCustomEditorByIdOrSlug(created.id)).resolves.toEqual(created);
    await expect(findCustomEditorByIdOrSlug(created.slug)).resolves.toEqual(created);

    const updated = await updateCustomEditor({
      id: created.id,
      name: "Cursor Stable",
      cli: "cursor",
      appPath: "/Applications/Cursor.app",
      extensionsPath: "/tmp/cursor/extensions-stable",
      settingsPath: "/tmp/cursor/settings-stable.json"
    });

    expect(updated.id).toBe(created.id);
    expect(updated.slug).toBe(created.slug);
    expect(updated.createdAt).toBe(created.createdAt);
    expect(updated.name).toBe("Cursor Stable");
    expect(updated.displayName).toBe("Cursor Stable");

    const removed = await removeCustomEditor(created.id);
    expect(removed.id).toBe(created.id);
    await expect(listCustomEditors()).resolves.toEqual([]);
  });

  it("rejects name and path conflicts when adding or updating editors", async () => {
    const first = await appendCustomEditor({
      name: "Cursor",
      extensionsPath: "/tmp/one/extensions",
      settingsPath: "/tmp/one/settings.json"
    });
    const second = await appendCustomEditor({
      name: "Code",
      extensionsPath: "/tmp/two/extensions",
      settingsPath: "/tmp/two/settings.json"
    });

    await expect(
      appendCustomEditor({
        name: "Cursor",
        extensionsPath: "/tmp/three/extensions",
        settingsPath: "/tmp/three/settings.json"
      })
    ).rejects.toSatisfy((error: unknown) => hasCustomEditorStoreErrorCode(error, CUSTOM_EDITOR_STORE_ERROR_CODE.ALREADY_EXISTS));

    await expect(
      appendCustomEditor({
        name: "Another",
        extensionsPath: first.extensionsPath,
        settingsPath: "/tmp/four/settings.json"
      })
    ).rejects.toSatisfy((error: unknown) => hasCustomEditorStoreErrorCode(error, CUSTOM_EDITOR_STORE_ERROR_CODE.ALREADY_EXISTS));

    await expect(
      updateCustomEditor({
        id: second.id,
        name: second.name,
        extensionsPath: second.extensionsPath,
        settingsPath: first.settingsPath,
        cli: second.cli,
        appPath: second.appPath
      })
    ).rejects.toSatisfy((error: unknown) => hasCustomEditorStoreErrorCode(error, CUSTOM_EDITOR_STORE_ERROR_CODE.ALREADY_EXISTS));
  });

  it("cleans up failed atomic writes without clobbering the existing store file", async () => {
    mkdirSync(storeDirPath, { recursive: true });
    writeFileSync(storeFilePath, `${JSON.stringify({ version: 1, editors: [] }, null, 2)}\n`, "utf8");
    chmodSync(storeDirPath, 0o500);

    await expect(
      appendCustomEditor({
        name: "Cursor",
        extensionsPath: "/tmp/cursor/extensions",
        settingsPath: "/tmp/cursor/settings.json"
      })
    ).rejects.toSatisfy((error: unknown) => hasCustomEditorStoreErrorCode(error, CUSTOM_EDITOR_STORE_ERROR_CODE.STORE_UNAVAILABLE));

    expect(readFileSync(storeFilePath, "utf8")).toBe(`${JSON.stringify({ version: 1, editors: [] }, null, 2)}\n`);
  });
});
