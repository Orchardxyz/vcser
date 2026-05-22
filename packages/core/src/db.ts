import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import type { PrismaClient } from "./generated/prisma";

type PrismaBetterSqlite3Ctor = new (options: { url: string }) => unknown;

type PrismaGlobal = typeof globalThis & {
  prisma?: PrismaClient;
  prismaUnavailable?: boolean;
};

// The generated Prisma client is CJS; Electron's main process is ESM, so we use createRequire to bridge.
const requireFromHere = createRequire(import.meta.url);
const packageRoot = dirname(requireFromHere.resolve("@vcser/core/package.json"));
const requireFromCorePackage = createRequire(join(packageRoot, "package.json"));
const { PrismaBetterSqlite3 } = requireFromCorePackage("@prisma/adapter-better-sqlite3") as {
  PrismaBetterSqlite3: PrismaBetterSqlite3Ctor;
};
const { PrismaClient: PrismaClientCtor } = requireFromCorePackage(requireFromCorePackage.resolve("@vcser/core/generated/prisma")) as {
  PrismaClient: new (opts: { adapter: unknown }) => PrismaClient;
};

const prismaGlobal = globalThis as PrismaGlobal;

function resolveDefaultDatabaseUrl(): string {
  return `file:${join(packageRoot, "prisma", "dev.db").replaceAll("\\", "/")}`;
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

  if (!prismaGlobal.prismaUnavailable) {
    prismaGlobal.prismaUnavailable = true;
    console.warn(`Prisma cache unavailable; falling back to uncached namespace resolution. ${summarizePrismaUnavailable(error)}`);
  }
}

export function getPrismaClient(): PrismaClient | undefined {
  if (prismaGlobal.prismaUnavailable) {
    return undefined;
  }

  if (!prismaGlobal.prisma) {
    try {
      const adapter = new PrismaBetterSqlite3({
        url: process.env.DATABASE_URL || resolveDefaultDatabaseUrl()
      });
      prismaGlobal.prisma = new PrismaClientCtor({ adapter });
    } catch (error) {
      markPrismaUnavailable(error);
      return undefined;
    }
  }

  return prismaGlobal.prisma;
}
