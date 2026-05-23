import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";

function isAbiMismatchError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return error.message.includes("NODE_MODULE_VERSION") || error.message.includes("better_sqlite3.node");
}

function resolveCorePackageRoot(): string {
  const requireFromHere = createRequire(typeof __filename === "string" ? __filename : import.meta.url);
  return dirname(requireFromHere.resolve("@vcser/core/package.json"));
}

function canLoadBetterSqlite3(): boolean {
  const corePackageRoot = resolveCorePackageRoot();
  const requireFromCorePackage = createRequire(resolve(corePackageRoot, "package.json"));
  const adapterPackagePath = requireFromCorePackage.resolve("@prisma/adapter-better-sqlite3");
  const requireFromAdapterPackage = createRequire(adapterPackagePath);

  try {
    const BetterSqlite3 = requireFromAdapterPackage("better-sqlite3") as new (path: string) => {
      exec(sql: string): unknown;
      close(): void;
    };
    const database = new BetterSqlite3(":memory:");
    database.exec("select 1");
    database.close();
    return true;
  } catch (error) {
    if (!isAbiMismatchError(error)) {
      throw error;
    }

    return false;
  }
}

export function ensureNodeNativeModulesReady(): void {
  if (canLoadBetterSqlite3()) {
    return;
  }

  const corePackageRoot = resolveCorePackageRoot();
  const repoRoot = resolve(corePackageRoot, "..", "..");
  const command = process.platform === "win32" ? "npm.cmd" : "npm";
  const result = spawnSync(command, ["rebuild", "better-sqlite3"], {
    cwd: corePackageRoot,
    stdio: "inherit"
  });

  if (result.status !== 0) {
    throw new Error("Failed to rebuild better-sqlite3 for the current Node.js runtime.");
  }
}
