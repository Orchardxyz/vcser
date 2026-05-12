import { createRequire } from "node:module";
import { join } from "node:path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import type { PrismaClient } from "@generated/prisma";

type PrismaGlobal = typeof globalThis & {
  prisma?: PrismaClient;
  prismaUnavailable?: boolean;
};

// The generated Prisma client is CJS; Electron's main process is ESM, so we use createRequire to bridge.
const _req = createRequire(join(process.cwd(), "placeholder.js"));
const { PrismaClient: PrismaClientCtor } = _req(join(process.cwd(), "src/generated/prisma")) as {
  PrismaClient: new (opts: { adapter: unknown }) => PrismaClient;
};

const prismaGlobal = globalThis as PrismaGlobal;

export function getPrismaClient(): PrismaClient | undefined {
  if (prismaGlobal.prismaUnavailable) {
    return undefined;
  }

  if (!prismaGlobal.prisma) {
    try {
      const adapter = new PrismaBetterSqlite3({
        url: process.env.DATABASE_URL || "file:./prisma/dev.db"
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
