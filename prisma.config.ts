import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "packages/core/prisma/schema.prisma",
  migrations: {
    path: "packages/core/prisma/migrations"
  },
  datasource: {
    url: "file:./packages/core/prisma/dev.db"
  }
});
