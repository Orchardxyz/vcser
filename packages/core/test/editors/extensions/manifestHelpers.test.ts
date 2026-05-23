import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  findExtensionManifestEntry,
  isExtensionManifestEntry,
  readExtensionManifestEntries,
  resolveManifestDirName,
  writeExtensionManifestEntries
} from "../../../src/editors/extensions/manifestHelpers";

function makeValidEntry(overrides: Record<string, unknown> = {}) {
  return { identifier: { id: "publisher.extension" }, version: "1.0.0", ...overrides };
}

describe("isExtensionManifestEntry", () => {
  it("accepts valid manifest entries", () => {
    expect(isExtensionManifestEntry(makeValidEntry())).toBe(true);
  });

  it("accepts entries without optional version and relativeLocation", () => {
    expect(isExtensionManifestEntry({ identifier: { id: "test.id" } })).toBe(true);
  });

  it("rejects null and primitives", () => {
    expect(isExtensionManifestEntry(null)).toBe(false);
    expect(isExtensionManifestEntry(42)).toBe(false);
    expect(isExtensionManifestEntry("string")).toBe(false);
  });

  it("rejects entries without identifier", () => {
    expect(isExtensionManifestEntry({ version: "1.0.0" })).toBe(false);
  });

  it("rejects entries with non-string id", () => {
    expect(isExtensionManifestEntry({ identifier: { id: 42 } })).toBe(false);
  });

  it("rejects entries with non-string version", () => {
    expect(isExtensionManifestEntry({ identifier: { id: "p.id" }, version: 1 })).toBe(false);
  });

  it("rejects entries with non-string relativeLocation", () => {
    expect(isExtensionManifestEntry({ identifier: { id: "p.id" }, relativeLocation: 123 })).toBe(false);
  });
});

describe("readExtensionManifestEntries", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "vcser-manifest-test-"));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("returns parsed array content", () => {
    const entries = [{ identifier: { id: "a.b" } }, { identifier: { id: "c.d" } }];
    writeFileSync(join(tmpDir, "extensions.json"), JSON.stringify(entries));
    expect(readExtensionManifestEntries(tmpDir)).toEqual(entries);
  });

  it("returns [] for missing files", () => {
    expect(readExtensionManifestEntries(tmpDir)).toEqual([]);
  });

  it("returns [] for non-array JSON", () => {
    writeFileSync(join(tmpDir, "extensions.json"), JSON.stringify({ key: "not-an-array" }));
    expect(readExtensionManifestEntries(tmpDir)).toEqual([]);
  });
});

describe("writeExtensionManifestEntries", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "vcser-manifest-test-"));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("writes pretty-printed JSON", () => {
    const entries = [{ identifier: { id: "a.b" }, version: "1.0.0" }];
    writeExtensionManifestEntries(tmpDir, entries);

    const raw = readFileSync(join(tmpDir, "extensions.json"), "utf-8");
    expect(JSON.parse(raw)).toEqual(entries);
    // pretty-printed: contains newlines and indentation
    expect(raw).toContain("\n");
    expect(raw).toContain("  ");
  });
});

describe("findExtensionManifestEntry", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "vcser-manifest-test-"));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("finds the matching entry by extension id", () => {
    const entries = [
      { identifier: { id: "first.ext" }, version: "1.0.0" },
      { identifier: { id: "second.ext" }, version: "2.0.0" }
    ];
    writeFileSync(join(tmpDir, "extensions.json"), JSON.stringify(entries));
    expect(findExtensionManifestEntry(tmpDir, "second.ext")).toEqual(entries[1]);
  });

  it("returns undefined when no entry matches", () => {
    const entries = [{ identifier: { id: "first.ext" }, version: "1.0.0" }];
    writeFileSync(join(tmpDir, "extensions.json"), JSON.stringify(entries));
    expect(findExtensionManifestEntry(tmpDir, "nonexistent")).toBeUndefined();
  });
});

describe("resolveManifestDirName", () => {
  it("prefers relativeLocation", () => {
    const entry = makeValidEntry({ relativeLocation: "custom-dir" });
    expect(resolveManifestDirName(entry)).toBe("custom-dir");
  });

  it("falls back to location.path basename", () => {
    const entry = makeValidEntry({ location: { path: "/some/path/ext-dir" } });
    expect(resolveManifestDirName(entry)).toBe("ext-dir");
  });

  it("prefers relativeLocation over location.path", () => {
    const entry = makeValidEntry({
      relativeLocation: "preferred-dir",
      location: { path: "/some/path/other-dir" }
    });
    expect(resolveManifestDirName(entry)).toBe("preferred-dir");
  });

  it("returns the provided fallback when no manifest-derived directory is available", () => {
    const entry = makeValidEntry();
    expect(resolveManifestDirName(entry, "fallback")).toBe("fallback");
  });

  it("returns undefined when there is no derived directory and no fallback", () => {
    const entry = makeValidEntry();
    expect(resolveManifestDirName(entry)).toBeUndefined();
  });

  it("returns fallback for non-manifest-entry values", () => {
    expect(resolveManifestDirName(null, "fallback")).toBe("fallback");
    expect(resolveManifestDirName("not-an-entry", "fallback")).toBe("fallback");
  });

  it("returns undefined for non-manifest-entry values without fallback", () => {
    expect(resolveManifestDirName(null)).toBeUndefined();
  });
});
