import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/prisma";

type PrismaGlobal = typeof globalThis & {
  prisma?: PrismaClient;
};

const prismaGlobal = globalThis as PrismaGlobal;
const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./prisma/dev.db",
});

export function getPrismaClient() {
  if (!prismaGlobal.prisma) {
    prismaGlobal.prisma = new PrismaClient({ adapter });
  }

  return prismaGlobal.prisma;
}
