import { basename } from "node:path";
import {
  appendCustomEditor,
  CustomEditorStoreError,
  findCustomEditorByIdOrSlug,
  isUnsupportedCustomEditorApp,
  removeCustomEditor,
  updateCustomEditor,
  type CustomEditorConflictCandidate
} from "@vcser/core/customEditors";
import type { CustomEditorInput, UpdateCustomEditorInput } from "@vcser/core/types";
import type { CliLogger } from "./logger";
import { createPromptRunner, type PromptRunner } from "./prompt";
import { pathExists, resolveCliEditors, type CliEditor } from "./editorResolution";

export interface CliCommandOptions {
  name?: string;
  cli?: string;
  appPath?: string;
  extensionsPath?: string;
  settingsPath?: string;
  yes?: boolean;
}

interface CustomEditorPromptAnswers {
  name?: string;
  cli?: string;
  appPath?: string;
  extensionsPath?: string;
  settingsPath?: string;
}

function normalizeFlagValue(value?: string): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function validateRequiredName(value: string): true | string {
  const normalized = value.trim();
  return normalized.length >= 2 ? true : "Name must be at least 2 characters.";
}

function validateRequiredPath(value: string): true | string {
  return value.trim().length > 0 ? true : "This path is required.";
}

function toConflictCandidates(editors: CliEditor[]): CustomEditorConflictCandidate[] {
  return editors.map((editor) => ({
    id: editor.id,
    slug: editor.slug,
    name: editor.name,
    displayName: editor.displayName,
    extensionsPath: editor.extensionsPath,
    settingsPath: editor.settingsPath
  }));
}

export function printCustomEditorError(logger: CliLogger, error: unknown): void {
  if (!(error instanceof CustomEditorStoreError)) {
    const message = error instanceof Error ? error.message : "Unknown CLI error.";
    logger.error(logger.palette.red(message));
    return;
  }

  if (error.code === "custom_editor_not_found") {
    logger.error(logger.palette.red("The custom editor could not be found."));
    return;
  }

  if (error.code === "custom_editor_already_exists") {
    logger.error(logger.palette.red(`A matching editor configuration already exists for ${error.conflict?.editorName ?? "another editor"}.`));
    return;
  }

  logger.error(logger.palette.red(error.message));
}

async function ensureSupportedAppPath(appPath: string): Promise<void> {
  const exists = await pathExists(appPath);
  const appName = basename(appPath);

  if (!exists) {
    throw new Error(`App path does not exist: ${appPath}`);
  }

  if (
    isUnsupportedCustomEditorApp({
      appPath,
      suggestedName: appName
    })
  ) {
    throw new Error(`${appName} is a helper or URL-handler app and cannot be added as an editor.`);
  }
}

async function promptForCustomEditorFields(initialValues: Partial<CustomEditorInput>, prompt: PromptRunner): Promise<CustomEditorInput> {
  const answers = await prompt<CustomEditorPromptAnswers>({
    type: "text",
    name: "name",
    message: "Editor name",
    initial: initialValues.name ?? "",
    validate: validateRequiredName
  });
  const cliAnswer = await prompt<CustomEditorPromptAnswers>({
    type: "text",
    name: "cli",
    message: "CLI command (optional)",
    initial: initialValues.cli ?? ""
  });
  const appPathAnswer = await prompt<CustomEditorPromptAnswers>({
    type: "text",
    name: "appPath",
    message: "App path (optional)",
    initial: initialValues.appPath ?? ""
  });
  const extensionsPathAnswer = await prompt<CustomEditorPromptAnswers>({
    type: "text",
    name: "extensionsPath",
    message: "Extensions path",
    initial: initialValues.extensionsPath ?? "",
    validate: validateRequiredPath
  });
  const settingsPathAnswer = await prompt<CustomEditorPromptAnswers>({
    type: "text",
    name: "settingsPath",
    message: "Settings path",
    initial: initialValues.settingsPath ?? "",
    validate: validateRequiredPath
  });

  return {
    name: answers.name ?? "",
    cli: cliAnswer.cli ?? "",
    appPath: appPathAnswer.appPath ?? "",
    extensionsPath: extensionsPathAnswer.extensionsPath ?? "",
    settingsPath: settingsPathAnswer.settingsPath ?? ""
  };
}

function mergeCustomEditorOptions(options: CliCommandOptions, fallback?: Partial<CustomEditorInput>): Partial<CustomEditorInput> {
  return {
    name: normalizeFlagValue(options.name) ?? fallback?.name,
    cli: normalizeFlagValue(options.cli) ?? fallback?.cli,
    appPath: normalizeFlagValue(options.appPath) ?? fallback?.appPath,
    extensionsPath: normalizeFlagValue(options.extensionsPath) ?? fallback?.extensionsPath,
    settingsPath: normalizeFlagValue(options.settingsPath) ?? fallback?.settingsPath
  };
}

function finalizeCustomEditorInput(input: Partial<CustomEditorInput>): CustomEditorInput {
  return {
    name: input.name ?? "",
    cli: input.cli ?? "",
    appPath: input.appPath ?? "",
    extensionsPath: input.extensionsPath ?? "",
    settingsPath: input.settingsPath ?? ""
  };
}

async function collectCustomEditorInput(
  options: CliCommandOptions,
  prompt: PromptRunner,
  fallback?: Partial<CustomEditorInput>
): Promise<CustomEditorInput> {
  const merged = mergeCustomEditorOptions(options, fallback);
  const isComplete = Boolean(merged.name && merged.extensionsPath && merged.settingsPath);
  const finalInput = isComplete ? finalizeCustomEditorInput(merged) : await promptForCustomEditorFields(merged, prompt);

  if (normalizeFlagValue(finalInput.appPath)) {
    await ensureSupportedAppPath(finalInput.appPath ?? "");
  }

  return finalInput;
}

function printEditorsList(editors: CliEditor[], logger: CliLogger): void {
  if (editors.length === 0) {
    logger.line(logger.palette.yellow("No editors detected."));
    return;
  }

  const detailWidth = Math.max((process.stdout.columns ?? 96) - 10, 24);

  const wrapValue = (value: string, width: number): string[] => {
    if (value.length <= width) {
      return [value];
    }

    const parts: string[] = [];
    let remaining = value;

    while (remaining.length > width) {
      const slice = remaining.slice(0, width);
      const breakIndex = Math.max(slice.lastIndexOf("/"), slice.lastIndexOf(" "));

      if (breakIndex > Math.floor(width / 3)) {
        parts.push(remaining.slice(0, breakIndex + 1));
        remaining = remaining.slice(breakIndex + 1);
        continue;
      }

      parts.push(slice);
      remaining = remaining.slice(width);
    }

    if (remaining.length > 0) {
      parts.push(remaining);
    }

    return parts;
  };

  const printDetail = (label: string, value: string) => {
    const wrapped = wrapValue(value, detailWidth);
    const prefix = `  ${logger.palette.cyan(label.padEnd(4))} `;
    const spacer = " ".repeat(8);

    logger.line(`${prefix}${wrapped[0]}`);
    for (const line of wrapped.slice(1)) {
      logger.line(`${spacer}${line}`);
    }
  };

  for (const [index, editor] of editors.entries()) {
    logger.line(logger.palette.brand(editor.displayName));
    logger.line(`  ${logger.palette.dim(editor.slug)}`);
    printDetail("Src", editor.source);
    printDetail("CLI", editor.cli || "-");
    printDetail("App", editor.appPath ?? "-");
    printDetail("Ext", editor.extensionsPath);
    printDetail("Set", editor.settingsPath);

    if (index < editors.length - 1) {
      logger.line(logger.palette.dim("  " + "·".repeat(Math.min(detailWidth, 36))));
      logger.line();
    }
  }
}

export async function runEditorList(logger: CliLogger): Promise<number> {
  const editors = await resolveCliEditors(logger);
  printEditorsList(editors, logger);
  return 0;
}

export async function runEditorAdd(options: CliCommandOptions, logger: CliLogger): Promise<number> {
  const prompt = createPromptRunner();
  const input = await collectCustomEditorInput(options, prompt);
  const editors = await resolveCliEditors(logger);
  const created = await appendCustomEditor(input, {
    reservedEditors: toConflictCandidates(editors),
    reservedSlugs: editors.map((editor) => editor.slug)
  });

  logger.line(logger.palette.green(`Saved custom editor: ${created.displayName} (${created.slug})`));
  return 0;
}

export async function runEditorUpdate(identifier: string, options: CliCommandOptions, logger: CliLogger): Promise<number> {
  const current = await findCustomEditorByIdOrSlug(identifier);

  if (!current) {
    logger.error(logger.palette.red("The custom editor could not be found."));
    return 1;
  }

  const prompt = createPromptRunner();
  const input = await collectCustomEditorInput(options, prompt, {
    name: current.displayName,
    cli: current.cli ?? "",
    appPath: current.appPath ?? "",
    extensionsPath: current.extensionsPath,
    settingsPath: current.settingsPath
  });
  const editors = await resolveCliEditors(logger);
  const updatedInput: UpdateCustomEditorInput = {
    id: current.id,
    ...input
  };
  const updated = await updateCustomEditor(updatedInput, {
    reservedEditors: toConflictCandidates(editors)
  });

  logger.line(logger.palette.green(`Updated custom editor: ${updated.displayName} (${updated.slug})`));
  return 0;
}

export async function runEditorRemove(identifier: string, options: CliCommandOptions, logger: CliLogger): Promise<number> {
  const current = await findCustomEditorByIdOrSlug(identifier);

  if (!current) {
    logger.error(logger.palette.red("The custom editor could not be found."));
    return 1;
  }

  if (!options.yes) {
    const prompt = createPromptRunner();
    const answer = await prompt<{ confirmed?: boolean }>({
      type: "confirm",
      name: "confirmed",
      initial: false,
      message: `Remove ${current.displayName}?`
    });

    if (!answer.confirmed) {
      logger.line(logger.palette.yellow("Cancelled."));
      return 0;
    }
  }

  await removeCustomEditor(current.id);
  logger.line(logger.palette.green(`Removed custom editor: ${current.displayName}`));
  return 0;
}
