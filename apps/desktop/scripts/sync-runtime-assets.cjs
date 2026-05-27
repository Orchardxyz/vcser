#!/usr/bin/env node

const { cpSync, existsSync, mkdirSync, rmSync } = require("node:fs");
const { resolve } = require("node:path");

const desktopRoot = resolve(__dirname, "..");
const repoRoot = resolve(desktopRoot, "..", "..");
const runtimeRoot = resolve(desktopRoot, "resources", "runtime", "core");

const assetsToSync = [
  {
    from: resolve(repoRoot, "packages", "core", "prisma", "migrations"),
    to: resolve(runtimeRoot, "prisma", "migrations")
  },
  {
    from: resolve(repoRoot, "packages", "core", "src", "generated", "prisma"),
    to: resolve(runtimeRoot, "generated", "prisma")
  }
];

rmSync(runtimeRoot, { recursive: true, force: true });
mkdirSync(runtimeRoot, { recursive: true });

for (const asset of assetsToSync) {
  if (!existsSync(asset.from)) {
    throw new Error(`Missing runtime asset source: ${asset.from}`);
  }

  mkdirSync(resolve(asset.to, ".."), { recursive: true });
  cpSync(asset.from, asset.to, { recursive: true });
}

console.log(`[runtime-assets] Synced assets into ${runtimeRoot}`);
