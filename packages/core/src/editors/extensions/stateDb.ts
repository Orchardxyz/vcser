import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

type BetterSqlite3Statement = {
  get(...params: unknown[]): unknown;
  run(...params: unknown[]): unknown;
};

type BetterSqlite3Database = {
  prepare(sql: string): BetterSqlite3Statement;
  close(): void;
};

type BetterSqlite3Ctor = new (filename: string) => BetterSqlite3Database;

const requireFromHere = createRequire(typeof __filename === "string" ? __filename : import.meta.url);
const moduleDir = dirname(fileURLToPath(import.meta.url));
const requireFromCoreModules = resolveCoreModuleRequire();
const requireFromAdapterPackage = createRequire(requireFromCoreModules.resolve("@prisma/adapter-better-sqlite3"));
const BetterSqlite3 = requireFromAdapterPackage("better-sqlite3") as BetterSqlite3Ctor;

function resolveCoreModuleRequire(): NodeJS.Require {
  const candidates = [join(moduleDir, "../../../package.json"), join(moduleDir, "../../../../packages/core/package.json")];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return createRequire(candidate);
    }
  }

  return requireFromHere;
}

function withStateDatabase<T>(stateDbPath: string, callback: (database: BetterSqlite3Database) => T): T {
  const database = new BetterSqlite3(stateDbPath);

  try {
    return callback(database);
  } finally {
    database.close();
  }
}

export function readStateDatabaseValue(stateDbPath: string, key: string): string | undefined {
  return withStateDatabase(stateDbPath, (database) => {
    const result = database.prepare("SELECT value FROM ItemTable WHERE key = ?").get(key);
    if (!result || typeof result !== "object") {
      return undefined;
    }

    const value = (result as { value?: unknown }).value;
    return typeof value === "string" ? value : undefined;
  });
}

export function writeStateDatabaseValue(stateDbPath: string, key: string, value: string): void {
  withStateDatabase(stateDbPath, (database) => {
    database.prepare("INSERT INTO ItemTable(key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(key, value);
  });
}
