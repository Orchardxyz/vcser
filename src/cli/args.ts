import meow from "meow";
import { readFileSync } from "node:fs";
import type { CliFlags, CustomEditorInput, SettingsMode } from "../editors/types";

function parseCustomJson(raw: string): CustomEditorInput {
  const parsed = JSON.parse(raw);
  if (
    typeof parsed.name !== "string" ||
    typeof parsed.extensionsPath !== "string" ||
    typeof parsed.settingsPath !== "string" ||
    typeof parsed.cli !== "string"
  ) {
    throw new Error(
      "Invalid --custom-json: must have name, extensionsPath, settingsPath, cli"
    );
  }
  return {
    name: parsed.name,
    extensionsPath: parsed.extensionsPath,
    settingsPath: parsed.settingsPath,
    cli: parsed.cli,
  };
}

function parseCustomFile(filePath: string): CustomEditorInput[] {
  const content = readFileSync(filePath, "utf-8");
  const parsed = JSON.parse(content);
  if (!Array.isArray(parsed)) {
    throw new Error("--custom-file must contain a JSON array of editor definitions");
  }
  return parsed.map((entry: unknown, i: number) => {
    const e = entry as Record<string, unknown>;
    if (
      typeof e.name !== "string" ||
      typeof e.extensionsPath !== "string" ||
      typeof e.settingsPath !== "string" ||
      typeof e.cli !== "string"
    ) {
      throw new Error(
        `Invalid editor at index ${i}: must have name, extensionsPath, settingsPath, cli`
      );
    }
    return {
      name: e.name,
      extensionsPath: e.extensionsPath,
      settingsPath: e.settingsPath,
      cli: e.cli,
    };
  });
}

export function parseArgs(): CliFlags {
  const cli = meow(
    `
    Usage
      $ vcser

    Options
      --dry-run              Preview changes without applying (default: false)
      --settings-mode        Merge mode: "safe" (default) or "exact"
      --custom-json          Add a custom editor as JSON string (repeatable)
      --custom-file          Path to a JSON file with custom editor definitions

    Examples
      $ vcser
      $ vcser --dry-run
      $ vcser --custom-json '{"name":"MyEditor","extensionsPath":"/path","settingsPath":"/path/settings.json","cli":"myeditor"}'
      $ vcser --custom-file ./my-editors.json --settings-mode exact
  `,
    {
      importMeta: import.meta,
      flags: {
        dryRun: { type: "boolean", default: false },
        settingsMode: { type: "string", default: "safe" },
        customJson: { type: "string", isMultiple: true },
        customFile: { type: "string" },
      },
    }
  );

  const settingsMode: SettingsMode =
    cli.flags.settingsMode === "exact" ? "exact" : "safe";

  const customEditors: CustomEditorInput[] = [];

  for (const raw of cli.flags.customJson ?? []) {
    try {
      customEditors.push(parseCustomJson(raw));
    } catch (err) {
      console.error(`Error parsing --custom-json: ${(err as Error).message}`);
      process.exit(1);
    }
  }

  if (cli.flags.customFile) {
    try {
      customEditors.push(...parseCustomFile(cli.flags.customFile));
    } catch (err) {
      console.error(`Error reading --custom-file: ${(err as Error).message}`);
      process.exit(1);
    }
  }

  return {
    dryRun: cli.flags.dryRun,
    settingsMode,
    customEditors,
  };
}
