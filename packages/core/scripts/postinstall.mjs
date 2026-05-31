import { existsSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const packageRoot = fileURLToPath(new URL("..", import.meta.url));
const workspacePrismaConfig = join(packageRoot, "..", "..", "prisma.config.ts");
const schemaPath = join(packageRoot, "prisma", "schema.prisma");

if (!existsSync(workspacePrismaConfig) || !existsSync(schemaPath)) {
  process.exit(0);
}

const generateCommand = spawnSync("pnpm", ["exec", "prisma", "generate", "--config", "../../prisma.config.ts", "--schema", "prisma/schema.prisma"], {
  cwd: packageRoot,
  stdio: "inherit"
});

process.exit(generateCommand.status ?? 1);
