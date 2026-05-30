import { readFileSync } from "node:fs";
import { chmod } from "node:fs/promises";
import { build, context } from "esbuild";
import { cac } from "cac";

const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const cli = cac("build");

cli.option("--watch", "Rebuild on file changes");

const parsed = cli.parse(process.argv, { run: false });
const watchEnabled = Boolean(parsed.options.watch);

const buildOptions = {
  entryPoints: ["src/bin.ts"],
  outfile: "dist/bin.cjs",
  bundle: true,
  format: "cjs",
  platform: "node",
  target: "node22",
  mainFields: ["module", "main"],
  sourcemap: true,
  logLevel: "info",
  logOverride: {
    "empty-import-meta": "silent"
  },
  packages: "bundle",
  define: {
    __CLI_VERSION__: JSON.stringify(packageJson.version)
  },
  banner: {
    js: "#!/usr/bin/env node"
  }
};

if (watchEnabled) {
  const buildContext = await context(buildOptions);
  await buildContext.watch();
  await chmod("dist/bin.cjs", 0o755).catch(() => undefined);
  console.log("[watch] @vcser/cli is watching for changes...");
} else {
  await build(buildOptions);
  await chmod("dist/bin.cjs", 0o755);
}
