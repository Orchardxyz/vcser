import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { findExtensionDir } from "../../../src/editors/extensions/extensionFs";

describe("findExtensionDir", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "vcser-fs-test-"));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("returns the matching directory for case-insensitive extension prefixes", async () => {
    const dirName = "publisher.extension-1.0.0";
    mkdirSync(join(tmpDir, dirName));

    // should match case-insensitively
    const result = await findExtensionDir(tmpDir, "PUBLISHER.extension");
    expect(result).toBe(join(tmpDir, dirName));
  });

  it("returns the first matching directory when multiple entries share a prefix", async () => {
    mkdirSync(join(tmpDir, "publisher.extension-1.0.0"));
    mkdirSync(join(tmpDir, "publisher.extension-2.0.0"));

    const result = await findExtensionDir(tmpDir, "publisher.extension");
    expect(result).toBe(join(tmpDir, "publisher.extension-1.0.0"));
  });

  it("ignores non-directory entries", async () => {
    writeFileSync(join(tmpDir, "publisher.extension-1.0.0-file.txt"), "not a dir");

    const result = await findExtensionDir(tmpDir, "publisher.extension");
    expect(result).toBeUndefined();
  });

  it("returns undefined when no matching directory exists", async () => {
    mkdirSync(join(tmpDir, "other.ext-1.0.0"));

    const result = await findExtensionDir(tmpDir, "publisher.extension");
    expect(result).toBeUndefined();
  });

  it("returns undefined when the extensions path is missing", async () => {
    const result = await findExtensionDir(join(tmpDir, "nonexistent"), "publisher.extension");
    expect(result).toBeUndefined();
  });
});
