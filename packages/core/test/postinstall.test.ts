import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { afterEach, describe, expect, it } from "vitest";

describe("postinstall", () => {
  let tempPackageRoot: string | undefined;

  afterEach(() => {
    if (tempPackageRoot) {
      rmSync(tempPackageRoot, { recursive: true, force: true });
    }
  });

  it("skips Prisma generation outside the workspace source tree", () => {
    tempPackageRoot = mkdtempSync(join(tmpdir(), "vcser-core-postinstall-"));
    mkdirSync(join(tempPackageRoot, "scripts"));
    cpSync(new URL("../scripts/postinstall.mjs", import.meta.url), join(tempPackageRoot, "scripts", "postinstall.mjs"));
    writeFileSync(join(tempPackageRoot, "package.json"), JSON.stringify({ name: "@vcser/core", type: "module" }), "utf8");

    const result = spawnSync(process.execPath, ["scripts/postinstall.mjs"], {
      cwd: tempPackageRoot,
      encoding: "utf8"
    });

    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
  });
});
