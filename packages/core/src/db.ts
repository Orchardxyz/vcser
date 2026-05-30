import { createRequire } from "node:module";
import { existsSync, mkdirSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { PrismaClient } from "./generated/prisma";
import { resolveDatabasePathFromUrl, resolveDatabaseUrl } from "./dataPaths";

type PrismaBetterSqlite3Ctor = new (options: { url: string }) => unknown;
type BetterSqlite3Database = {
  exec(sql: string): BetterSqlite3Database;
  prepare(sql: string): {
    all(...params: unknown[]): unknown[];
    get(...params: unknown[]): unknown;
    run(...params: unknown[]): unknown;
  };
  close(): void;
};
type BetterSqlite3Ctor = new (filename: string) => BetterSqlite3Database;

type PrismaGlobal = typeof globalThis & {
  prisma?: PrismaClient;
  prismaUnavailable?: boolean;
  prismaUnavailableReason?: string;
};

// The generated Prisma client is CJS; Electron's main process is ESM, so we use createRequire to bridge.
const requireFromHere = createRequire(typeof __filename === "string" ? __filename : import.meta.url);
const modulePath = typeof __filename === "string" ? __filename : fileURLToPath(import.meta.url);
const moduleDir = dirname(modulePath);
const runtimeCorePaths = resolveRuntimeCorePaths();
const requireFromCoreModules = resolveCoreModuleRequire();
const requireFromAdapterPackage = createRequire(requireFromCoreModules.resolve("@prisma/adapter-better-sqlite3"));
const { PrismaBetterSqlite3 } = requireFromCoreModules("@prisma/adapter-better-sqlite3") as {
  PrismaBetterSqlite3: PrismaBetterSqlite3Ctor;
};
const BetterSqlite3 = requireFromAdapterPackage("better-sqlite3") as BetterSqlite3Ctor;
const { PrismaClient: PrismaClientCtor } = requireFromHere(runtimeCorePaths.generatedPrismaClientPath) as {
  PrismaClient: new (opts: { adapter: unknown }) => PrismaClient;
};

const prismaGlobal = globalThis as PrismaGlobal;

function resolveMigrationsPath(): string {
  return runtimeCorePaths.migrationsPath;
}

function resolveRuntimeCorePaths(): { generatedPrismaClientPath: string; migrationsPath: string } {
  const processWithResourcesPath = process as NodeJS.Process & { resourcesPath?: string };
  const candidates = [
    {
      generatedPrismaClientPath: join(moduleDir, "../../resources/runtime/core/generated/prisma/index.js"),
      migrationsPath: join(moduleDir, "../../resources/runtime/core/prisma/migrations")
    },
    {
      generatedPrismaClientPath: join(moduleDir, "../../core/src/generated/prisma/index.js"),
      migrationsPath: join(moduleDir, "../../core/prisma/migrations")
    },
    processWithResourcesPath.resourcesPath
      ? {
          generatedPrismaClientPath: join(processWithResourcesPath.resourcesPath, "core", "generated", "prisma", "index.js"),
          migrationsPath: join(processWithResourcesPath.resourcesPath, "core", "prisma", "migrations")
        }
      : undefined,
    {
      generatedPrismaClientPath: join(moduleDir, "generated", "prisma", "index.js"),
      migrationsPath: join(moduleDir, "..", "prisma", "migrations")
    }
  ];

  for (const candidate of candidates) {
    if (candidate && existsSync(candidate.generatedPrismaClientPath) && existsSync(candidate.migrationsPath)) {
      return candidate;
    }
  }

  throw new Error("Unable to resolve runtime Prisma assets");
}

function resolveCoreModuleRequire(): NodeJS.Require {
  const candidates = [join(moduleDir, "../../core/package.json"), join(moduleDir, "../package.json"), join(moduleDir, "../../package.json")];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return createRequire(candidate);
    }
  }

  return requireFromHere;
}

function ensureDatabaseDirectory(url: string): void {
  const databasePath = resolveDatabasePathFromUrl(url);

  if (!databasePath) {
    return;
  }

  mkdirSync(dirname(databasePath), { recursive: true });
}

function ensureRuntimeMigrationsTable(database: BetterSqlite3Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS "__vcser_runtime_migrations" (
      "name" TEXT NOT NULL PRIMARY KEY,
      "appliedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

function listPendingMigrationFiles(database: BetterSqlite3Database): Array<{ name: string; sql: string }> {
  const appliedRows = database.prepare(`SELECT "name" FROM "__vcser_runtime_migrations"`).all() as Array<{ name: string }>;
  const appliedNames = new Set(appliedRows.map((row) => row.name));

  return readdirSync(resolveMigrationsPath(), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right))
    .filter((name) => !appliedNames.has(name))
    .map((name) => ({
      name,
      sql: readFileSync(join(resolveMigrationsPath(), name, "migration.sql"), "utf8")
    }));
}

function applyPendingMigrations(databasePath: string): void {
  const database = new BetterSqlite3(databasePath);

  try {
    ensureRuntimeMigrationsTable(database);

    const pendingMigrations = listPendingMigrationFiles(database);
    if (pendingMigrations.length === 0) {
      return;
    }

    database.exec("BEGIN");

    try {
      for (const migration of pendingMigrations) {
        database.exec(migration.sql);
        database.prepare(`INSERT INTO "__vcser_runtime_migrations" ("name") VALUES (?)`).run(migration.name);
      }

      database.exec("COMMIT");
    } catch (error) {
      database.exec("ROLLBACK");
      throw error;
    }
  } finally {
    database.close();
  }
}

function bootstrapDatabaseSchema(url: string): void {
  const databasePath = resolveDatabasePathFromUrl(url);

  if (!databasePath) {
    return;
  }

  applyPendingMigrations(databasePath);
}

function summarizePrismaUnavailable(error: unknown): string {
  if (!(error instanceof Error)) {
    return String(error);
  }

  const lines = error.message
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    lines.find((line) => line.includes("NODE_MODULE_VERSION")) ??
    lines.find((line) => line.includes("Could not locate the bindings file")) ??
    lines.find((line) => line.includes("ERR_DLOPEN_FAILED")) ??
    lines[0] ??
    error.name
  );
}

export function markPrismaUnavailable(error?: unknown): void {
  prismaGlobal.prisma = undefined;
  prismaGlobal.prismaUnavailableReason = summarizePrismaUnavailable(error);

  if (!prismaGlobal.prismaUnavailable) {
    prismaGlobal.prismaUnavailable = true;
    console.warn(`Prisma cache unavailable; falling back to uncached namespace resolution. ${prismaGlobal.prismaUnavailableReason}`);
  }
}

export function getPrismaUnavailableReason(): string | undefined {
  return prismaGlobal.prismaUnavailableReason;
}

export function getPrismaClient(): PrismaClient | undefined {
  if (prismaGlobal.prismaUnavailable) {
    return undefined;
  }

  if (!prismaGlobal.prisma) {
    try {
      const databaseUrl = resolveDatabaseUrl();
      ensureDatabaseDirectory(databaseUrl);
      bootstrapDatabaseSchema(databaseUrl);
      const adapter = new PrismaBetterSqlite3({
        url: databaseUrl
      });
      prismaGlobal.prisma = new PrismaClientCtor({ adapter });
    } catch (error) {
      markPrismaUnavailable(error);
      return undefined;
    }
  }

  return prismaGlobal.prisma;
}
