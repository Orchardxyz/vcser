import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import type { PrismaClient } from "./generated/prisma";

type PrismaGlobal = typeof globalThis & {
  prisma?: PrismaClient;
  prismaUnavailable?: boolean;
};

// The generated Prisma client is CJS; Electron's main process is ESM, so we use createRequire to bridge.
const requireFromHere = createRequire(import.meta.url);
const packageRoot = dirname(requireFromHere.resolve("@vcser/core/package.json"));
const { PrismaClient: PrismaClientCtor } = requireFromHere(requireFromHere.resolve("@vcser/core/generated/prisma")) as {
  PrismaClient: new (opts: { adapter: unknown }) => PrismaClient;
};

const prismaGlobal = globalThis as PrismaGlobal;

function resolveDefaultDatabaseUrl(): string {
  return `file:${join(packageRoot, "prisma", "dev.db").replaceAll("\\", "/")}`;
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
      prismaGlobal.prismaUnavailable = true;
      console.warn("Prisma cache unavailable; falling back to uncached namespace resolution.", error);
      return undefined;
    }
  }

  return prismaGlobal.prisma;
}
