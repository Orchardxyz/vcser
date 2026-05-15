#!/usr/bin/env node

const { spawnSync } = require("node:child_process");
const { existsSync } = require("node:fs");
const { dirname, resolve } = require("node:path");

function getElectronBinaryPath() {
  try {
    const electronPath = require("electron");

    if (typeof electronPath === "string" && electronPath.length > 0) {
      return electronPath;
    }

    return "";
  } catch {
    return "";
  }
}

const electronBinaryPath = getElectronBinaryPath();

if (electronBinaryPath && existsSync(electronBinaryPath)) {
  console.log("[postinstall] Electron binary already installed. Skipping download.");
  process.exit(0);
}

const electronPackageJsonPath = require.resolve("electron/package.json");
const electronInstallScriptPath = resolve(dirname(electronPackageJsonPath), "install.js");

console.log("[postinstall] Electron binary not found. Running electron/install.js ...");

const result = spawnSync(process.execPath, [electronInstallScriptPath], {
  stdio: "inherit"
});

if (typeof result.status === "number") {
  process.exit(result.status);
}

process.exit(1);
