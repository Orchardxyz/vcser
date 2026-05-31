import { existsSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const packageRoot = fileURLToPath(new URL("..", import.meta.url));
const workspacePrismaConfig = join(packageRoot, "..", "..", "prisma.config.ts");
const schemaPath = join(packageRoot, "prisma", "schema.prisma");
const pnpmCommand = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

if (!existsSync(workspacePrismaConfig) || !existsSync(schemaPath)) {
  process.exit(0);
}

const generateCommand = spawnSync(
  pnpmCommand,
  ["exec", "prisma", "generate", "--config", "../../prisma.config.ts", "--schema", "prisma/schema.prisma"],
  {
    cwd: packageRoot,
    stdio: "inherit"
  }
);

if (generateCommand.error) {
  console.error(`[postinstall] Failed to run ${pnpmCommand}:`, generateCommand.error);
}

process.exit(generateCommand.status ?? 1);
