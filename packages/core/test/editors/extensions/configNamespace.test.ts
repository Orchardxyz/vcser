import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  deduplicateNamespaceRows,
  extractConfigNamespaces,
  readExtensionNamespaces,
  resolveNamespacesToExtensions
} from "../../../src/editors/extensions/configNamespace";

function makeExtensionDir(basePath: string, extensionId: string, packageJson: Record<string, unknown>): string {
  const dirName = `${extensionId}-1.0.0`;
  const dir = join(basePath, dirName);
  mkdirSync(dir);
  writeFileSync(join(dir, "package.json"), JSON.stringify(packageJson));
  return dir;
}

describe("extractConfigNamespaces", () => {
  it("extracts namespace from a single configuration block", () => {
    const namespaces = extractConfigNamespaces({
      contributes: {
        configuration: {
          properties: {
            "editor.fontSize": { type: "number" },
            "editor.lineHeight": { type: "number" }
          }
        }
      }
    });
    expect(namespaces).toEqual(["editor"]);
  });

  it("extracts namespaces from an array of configuration blocks", () => {
    const namespaces = extractConfigNamespaces({
      contributes: {
        configuration: [
          {
            properties: {
              "editor.fontSize": { type: "number" }
            }
          },
          {
            properties: {
              "workbench.colorTheme": { type: "string" }
            }
          }
        ]
      }
    });
    expect(namespaces.sort()).toEqual(["editor", "workbench"]);
  });

  it("deduplicates namespaces across configuration blocks", () => {
    const namespaces = extractConfigNamespaces({
      contributes: {
        configuration: [{ properties: { "editor.fontSize": {} } }, { properties: { "editor.tabSize": {} } }]
      }
    });
    expect(namespaces).toEqual(["editor"]);
  });

  it("returns empty array when contributes is missing", () => {
    expect(extractConfigNamespaces({})).toEqual([]);
  });

  it("returns empty array when configuration is missing", () => {
    expect(extractConfigNamespaces({ contributes: {} })).toEqual([]);
  });
});

describe("deduplicateNamespaceRows", () => {
  it("removes duplicate rows with same extensionId and namespace", () => {
    const rows = [
      { extensionId: "publisher.a", namespace: "editor" },
      { extensionId: "publisher.a", namespace: "editor" },
      { extensionId: "publisher.b", namespace: "workbench" }
    ];
    const result = deduplicateNamespaceRows(rows);
    expect(result).toEqual([
      { extensionId: "publisher.a", namespace: "editor" },
      { extensionId: "publisher.b", namespace: "workbench" }
    ]);
  });

  it("preserves rows with different namespaces for the same extension", () => {
    const rows = [
      { extensionId: "publisher.a", namespace: "editor" },
      { extensionId: "publisher.a", namespace: "workbench" }
    ];
    expect(deduplicateNamespaceRows(rows)).toEqual(rows);
  });

  it("preserves rows with different extensions for the same namespace", () => {
    const rows = [
      { extensionId: "publisher.a", namespace: "editor" },
      { extensionId: "publisher.b", namespace: "editor" }
    ];
    expect(deduplicateNamespaceRows(rows)).toEqual(rows);
  });

  it("returns empty array for empty input", () => {
    expect(deduplicateNamespaceRows([])).toEqual([]);
  });
});

describe("readExtensionNamespaces", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "vcser-ns-test-"));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("extracts namespace from extension package.json in temp directory", async () => {
    makeExtensionDir(tmpDir, "publisher.test-ext", {
      contributes: {
        configuration: {
          properties: {
            "editor.fontSize": {}
          }
        }
      }
    });

    const namespaces = await readExtensionNamespaces(tmpDir, "publisher.test-ext");
    expect(namespaces).toEqual(["editor"]);
  });

  it("returns empty array when extension directory is missing", async () => {
    const namespaces = await readExtensionNamespaces(tmpDir, "nonexistent.ext");
    expect(namespaces).toEqual([]);
  });

  it("returns empty array when package.json is missing", async () => {
    const dirName = "publisher.no-pkg-1.0.0";
    mkdirSync(join(tmpDir, dirName));

    const namespaces = await readExtensionNamespaces(tmpDir, "publisher.no-pkg");
    expect(namespaces).toEqual([]);
  });

  it("returns empty array when package.json is malformed", async () => {
    const dirName = "publisher.malformed-1.0.0";
    mkdirSync(join(tmpDir, dirName));
    writeFileSync(join(tmpDir, dirName, "package.json"), "not valid json {");

    const namespaces = await readExtensionNamespaces(tmpDir, "publisher.malformed");
    expect(namespaces).toEqual([]);
  });
});

describe("resolveNamespacesToExtensions", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "vcser-resolve-test-"));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("resolves uncached ids from temp extension directories when no prisma", async () => {
    makeExtensionDir(tmpDir, "publisher.alpha", {
      contributes: {
        configuration: {
          properties: { "alpha.key": {} }
        }
      }
    });

    const result = await resolveNamespacesToExtensions({
      extensionIds: ["publisher.alpha"],
      extensionsPaths: [tmpDir]
    });

    expect(result.namespaceToExtension.get("alpha")).toBe("publisher.alpha");
  });

  it("returns empty maps when no extensions match", async () => {
    const result = await resolveNamespacesToExtensions({
      extensionIds: ["nonexistent.ext"],
      extensionsPaths: [tmpDir]
    });

    expect(result.namespaceToExtension.size).toBe(0);
    expect(result.extensionIcons.size).toBe(0);
  });

  it("prefers cached rows when a mocked prisma client returns them", async () => {
    // Set up an extension dir that would produce "editor" namespace
    makeExtensionDir(tmpDir, "publisher.cached-ext", {
      contributes: {
        configuration: {
          properties: { "editor.key": {} }
        }
      }
    });

    // But also set up another extension that would produce "editor"
    makeExtensionDir(tmpDir, "publisher.uncached-ext", {
      contributes: {
        configuration: {
          properties: { "editor.otherKey": {} }
        }
      }
    });

    // Mock prisma that returns a cached row for publisher.uncached-ext
    const mockPrisma = {
      extensionNamespaceCache: {
        findMany: async () => [{ extensionId: "publisher.uncached-ext", namespace: "editor" }],
        createMany: async () => ({ count: 0 })
      }
    };

    const result = await resolveNamespacesToExtensions({
      extensionIds: ["publisher.cached-ext", "publisher.uncached-ext"],
      extensionsPaths: [tmpDir],
      prisma: mockPrisma as unknown as Parameters<typeof resolveNamespacesToExtensions>[0]["prisma"]
    });

    // publisher.uncached-ext took the namespace via cache (first-batch priority)
    expect(result.namespaceToExtension.get("editor")).toBe("publisher.uncached-ext");
  });

  it("handles prisma that throws by falling back to fs resolution", async () => {
    makeExtensionDir(tmpDir, "publisher.resilient", {
      contributes: {
        configuration: {
          properties: { "resilient.key": {} }
        }
      }
    });

    const brokenPrisma = {
      extensionNamespaceCache: {
        findMany: async () => {
          throw new Error("db offline");
        },
        createMany: async () => {
          throw new Error("db offline");
        }
      }
    };

    const result = await resolveNamespacesToExtensions({
      extensionIds: ["publisher.resilient"],
      extensionsPaths: [tmpDir],
      prisma: brokenPrisma as unknown as Parameters<typeof resolveNamespacesToExtensions>[0]["prisma"]
    });

    expect(result.namespaceToExtension.get("resilient")).toBe("publisher.resilient");
  });
});
