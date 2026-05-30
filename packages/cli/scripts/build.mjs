import path from "node:path";
import { readFileSync } from "node:fs";
import { chmod } from "node:fs/promises";
import { build, context } from "esbuild";
import { cac } from "cac";

const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const cli = cac("build");

cli.option("--watch", "Rebuild on file changes");

const parsed = cli.parse(process.argv, { run: false });
const watchEnabled = Boolean(parsed.options.watch);
const coreSrcPath = path.resolve(import.meta.dirname, "../../core/src");

const buildOptions = {
  entryPoints: ["src/bin.ts"],
  outfile: "dist/bin.cjs",
  bundle: true,
  format: "cjs",
  platform: "node",
  target: "node22",
  sourcemap: true,
  logLevel: "info",
  logOverride: {
    "empty-import-meta": "silent"
  },
  packages: "bundle",
  alias: {
    "@vcser/core/customEditors": path.resolve(coreSrcPath, "customEditors.ts"),
    "@vcser/core/dataPaths": path.resolve(coreSrcPath, "dataPaths.ts"),
    "@vcser/core/db": path.resolve(coreSrcPath, "db.ts"),
    "@vcser/core/editors/detect/detect": path.resolve(coreSrcPath, "editors/detect/detect.ts"),
    "@vcser/core/editors/extensions/extensions": path.resolve(coreSrcPath, "editors/extensions/extensions.ts"),
    "@vcser/core/editors/extensions/extensionSync": path.resolve(coreSrcPath, "editors/extensions/extensionSync.ts"),
    "@vcser/core/i18n": path.resolve(coreSrcPath, "shared/i18n.ts"),
    "@vcser/core/typeGuards": path.resolve(coreSrcPath, "typeGuards.ts"),
    "@vcser/core/types": path.resolve(coreSrcPath, "shared/types.ts")
  },
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
