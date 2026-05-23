import { createRequire } from "node:module";
import { mkdirSync, readFileSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import type { PrismaClient } from "./generated/prisma";

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
const packageRoot = dirname(requireFromHere.resolve("@vcser/core/package.json"));
const requireFromCorePackage = createRequire(join(packageRoot, "package.json"));
const adapterPackagePath = requireFromCorePackage.resolve("@prisma/adapter-better-sqlite3");
const requireFromAdapterPackage = createRequire(adapterPackagePath);
const { PrismaBetterSqlite3 } = requireFromAdapterPackage("@prisma/adapter-better-sqlite3") as {
  PrismaBetterSqlite3: PrismaBetterSqlite3Ctor;
};
const BetterSqlite3 = requireFromAdapterPackage("better-sqlite3") as BetterSqlite3Ctor;
const { PrismaClient: PrismaClientCtor } = requireFromCorePackage(requireFromCorePackage.resolve("@vcser/core/generated/prisma")) as {
  PrismaClient: new (opts: { adapter: unknown }) => PrismaClient;
};

const prismaGlobal = globalThis as PrismaGlobal;

function resolveDefaultDatabaseUrl(): string {
  return toSqliteFileUrl(resolveDefaultDatabasePath());
}

function resolveDefaultDatabasePath(): string {
  if (process.platform === "darwin") {
    return join(homedir(), "Library", "Application Support", "vcser", "data.db");
  }

  if (process.platform === "win32") {
    const appData = process.env.APPDATA?.trim();
    return join(appData || join(homedir(), "AppData", "Roaming"), "vcser", "data.db");
  }

  return join(homedir(), ".local", "share", "vcser", "data.db");
}

function toSqliteFileUrl(filePath: string): string {
  return `file:${filePath.replaceAll("\\", "/")}`;
}

function resolveDatabasePathFromUrl(url: string): string | undefined {
  if (!url.startsWith("file:")) {
    return undefined;
  }

  const normalized = url.slice("file:".length).split(/[?#]/, 1)[0];
  if (!normalized) {
    return undefined;
  }

  if (process.platform === "win32" && normalized.startsWith("/") && /^[A-Za-z]:\//.test(normalized.slice(1))) {
    return normalized.slice(1);
  }

  return normalized;
}

function resolveMigrationsPath(): string {
  return join(packageRoot, "prisma", "migrations");
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

export function resolveDatabaseUrl(): string {
  return process.env.DATABASE_URL || resolveDefaultDatabaseUrl();
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
