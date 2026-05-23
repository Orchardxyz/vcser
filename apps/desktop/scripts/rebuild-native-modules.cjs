#!/usr/bin/env node

const { spawnSync } = require("node:child_process");
const { createRequire } = require("node:module");
const { dirname, join, resolve } = require("node:path");

const desktopRoot = resolve(__dirname, "..");
const repoRoot = resolve(desktopRoot, "..", "..");
const coreRoot = resolve(repoRoot, "packages", "core");
const requireFromDesktop = createRequire(join(desktopRoot, "package.json"));
const electronBuilderPackageJsonPath = requireFromDesktop.resolve("electron-builder/package.json");
const requireFromElectronBuilder = createRequire(electronBuilderPackageJsonPath);
const electronRebuildMainPath = requireFromElectronBuilder.resolve("@electron/rebuild");
const electronRebuildCliPath = join(dirname(electronRebuildMainPath), "cli.js");
const electronPackageJsonPath = requireFromDesktop.resolve("electron/package.json");
const electronModuleDir = dirname(electronPackageJsonPath);

console.log("[native-rebuild] Rebuilding better-sqlite3 for Electron using packages/core as the module root.");

const result = spawnSync(
  process.execPath,
  [
    electronRebuildCliPath,
    "--module-dir",
    coreRoot,
    "--electron-prebuilt-dir",
    electronModuleDir,
    "--force",
    "--only",
    "better-sqlite3",
    "--types",
    "prod,dev,optional"
  ],
  {
    cwd: repoRoot,
    stdio: "inherit"
  }
);

if (typeof result.status === "number") {
  process.exit(result.status);
}

process.exit(1);
