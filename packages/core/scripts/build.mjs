import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, extname, join, relative } from "node:path";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const packageRoot = fileURLToPath(new URL("..", import.meta.url));
const distDir = join(packageRoot, "dist");
const tsBuildInfoPath = join(packageRoot, ".tsbuildinfo");
const legacyDistTsBuildInfoPath = join(distDir, ".tsbuildinfo");
const requireFromPackage = createRequire(new URL("../package.json", import.meta.url));
const tscBinPath = requireFromPackage.resolve("typescript/bin/tsc");

rmSync(distDir, { recursive: true, force: true });
rmSync(tsBuildInfoPath, { force: true });

const compileCommand = spawnSync(process.execPath, [tscBinPath, "-p", "tsconfig.build.json"], {
  cwd: packageRoot,
  stdio: "inherit"
});

if (compileCommand.status !== 0) {
  process.exit(compileCommand.status ?? 1);
}

copyRuntimeAssets();
rewriteModuleSpecifiers(distDir);
rmSync(tsBuildInfoPath, { force: true });
rmSync(legacyDistTsBuildInfoPath, { force: true });

function rewriteModuleSpecifiers(rootDir) {
  for (const filePath of listFiles(rootDir)) {
    if (relative(rootDir, filePath).startsWith("generated/")) {
      continue;
    }

    const extension = extname(filePath);

    if (extension !== ".js" && extension !== ".ts") {
      continue;
    }

    const source = readFileSync(filePath, "utf8");
    const rewritten = source.replaceAll(
      /(from\s+["']|import\s*\(\s*["'])(\.\.?\/[^"']+)(["'])/g,
      (match, prefix, specifier, suffix) => `${prefix}${resolveSpecifier(filePath, specifier, extension)}${suffix}`
    );

    if (rewritten !== source) {
      writeFileSync(filePath, rewritten);
    }
  }
}

function resolveSpecifier(filePath, specifier, extension) {
  if (extname(specifier)) {
    return specifier;
  }

  const fileDir = dirname(filePath);
  const outputExtension = extension === ".js" ? ".js" : ".d.ts";
  const directCandidate = join(fileDir, `${specifier}${outputExtension}`);
  const indexCandidate = join(fileDir, specifier, `index${outputExtension}`);

  if (existsSync(directCandidate)) {
    return `${specifier}.js`;
  }

  if (existsSync(indexCandidate)) {
    return `${specifier}/index.js`;
  }

  throw new Error(`Unable to resolve ${specifier} from ${relative(packageRoot, filePath)}`);
}

function copyRuntimeAssets() {
  const generatedPrismaSource = join(packageRoot, "src", "generated", "prisma");
  const generatedPrismaTarget = join(distDir, "generated", "prisma");
  const migrationsSource = join(packageRoot, "prisma", "migrations");
  const migrationsTarget = join(packageRoot, "prisma", "migrations");

  if (!existsSync(generatedPrismaSource)) {
    throw new Error("Generated Prisma client is missing. Run pnpm --filter @vcser/core db:generate first.");
  }

  mkdirSync(dirname(generatedPrismaTarget), { recursive: true });
  cpSync(generatedPrismaSource, generatedPrismaTarget, { recursive: true });

  if (!existsSync(migrationsSource) || !existsSync(migrationsTarget)) {
    throw new Error("Prisma migrations are missing.");
  }
}

function listFiles(rootDir) {
  const entries = readdirSync(rootDir);
  const files = [];

  for (const entry of entries) {
    const filePath = join(rootDir, entry);
    const stats = statSync(filePath);

    if (stats.isDirectory()) {
      files.push(...listFiles(filePath));
      continue;
    }

    files.push(filePath);
  }

  return files;
}
