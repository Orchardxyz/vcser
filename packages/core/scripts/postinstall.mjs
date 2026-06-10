import { existsSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const packageRoot = fileURLToPath(new URL("..", import.meta.url));
const workspacePrismaConfig = join(packageRoot, "..", "..", "prisma.config.ts");
const schemaPath = join(packageRoot, "prisma", "schema.prisma");

if (!existsSync(workspacePrismaConfig) || !existsSync(schemaPath)) {
  process.exit(0);
}

const requireFromPackage = createRequire(new URL("../package.json", import.meta.url));
const prismaCliPath = requireFromPackage.resolve("prisma/build/index.js");

const generateCommand = spawnSync(
  process.execPath,
  [prismaCliPath, "generate", "--config", "../../prisma.config.ts", "--schema", "prisma/schema.prisma"],
  {
    cwd: packageRoot,
    stdio: "inherit"
  }
);

if (generateCommand.error) {
  console.error("[postinstall] Failed to run Prisma generate:", generateCommand.error);
}

process.exit(generateCommand.status ?? 1);
