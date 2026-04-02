#!/usr/bin/env node
import React from "react";
import { render } from "ink";
import { parseArgs } from "./cli/args.js";
import { BUILTIN_EDITORS } from "./editors/registry.js";
import { detectInstalledEditors } from "./editors/detect.js";
import { runPreflight } from "./preflight/checks.js";
import { App } from "./app.js";

const flags = parseArgs();

const detected = detectInstalledEditors(BUILTIN_EDITORS, flags.customEditors);

if (detected.length === 0) {
  console.error(
    "No VS Code-based editors detected on this system.\n" +
      "Use --custom-json or --custom-file to add editors manually."
  );
  process.exit(1);
}

const preflight = runPreflight(detected);
const hasWarnings = preflight.some((r) => r.warnings.length > 0);

if (hasWarnings) {
  console.log("\n  Preflight warnings:\n");
  for (const result of preflight) {
    for (const warning of result.warnings) {
      console.log(`  ⚠ ${result.editor.name}: ${warning}`);
    }
  }
  console.log("");
}

render(<App detectedEditors={detected} flags={flags} />);
