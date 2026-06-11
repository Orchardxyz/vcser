import { basename } from "node:path";
import {
  appendCustomEditor,
  CUSTOM_EDITOR_STORE_ERROR_CODE,
  findCustomEditorByIdOrSlug,
  hasCustomEditorStoreErrorCode,
  isCustomEditorStoreError,
  isUnsupportedCustomEditorApp,
  removeCustomEditor,
  updateCustomEditor,
  type CustomEditorConflictCandidate
} from "@vcser/core/customEditors";
import type { CustomEditorInput, UpdateCustomEditorInput } from "@vcser/core/types";
import type { CliLogger } from "../logger";
import type { CliI18n } from "../locales/i18n";
import { createPromptRunner, type PromptRunner } from "../prompt";
import { pathExists, resolveCliEditors, type CliEditor } from "./resolution";

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

function validateRequiredName(value: string, i18n: CliI18n): true | string {
  const normalized = value.trim();
  return normalized.length >= 2 ? true : i18n.t("editor.validate.nameMinLength");
}

function validateRequiredPath(value: string, i18n: CliI18n): true | string {
  return value.trim().length > 0 ? true : i18n.t("editor.validate.pathRequired");
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

export function printCustomEditorError(logger: CliLogger, error: unknown, i18n: CliI18n): void {
  if (!isCustomEditorStoreError(error)) {
    const message = error instanceof Error ? error.message : i18n.t("common.unknownCliError");
    logger.error(logger.palette.red(message));
    return;
  }

  if (hasCustomEditorStoreErrorCode(error, CUSTOM_EDITOR_STORE_ERROR_CODE.NOT_FOUND)) {
    logger.error(logger.palette.red(i18n.t("editor.error.notFound")));
    return;
  }

  if (hasCustomEditorStoreErrorCode(error, CUSTOM_EDITOR_STORE_ERROR_CODE.ALREADY_EXISTS)) {
    logger.error(
      logger.palette.red(
        i18n.t("editor.error.alreadyExists", {
          editorName: error.conflict?.editorName ?? i18n.t("editor.error.anotherEditor")
        })
      )
    );
    return;
  }

  logger.error(logger.palette.red(error.message));
}

async function ensureSupportedAppPath(appPath: string, i18n: CliI18n): Promise<void> {
  const exists = await pathExists(appPath);
  const appName = basename(appPath);

  if (!exists) {
    throw new Error(
      i18n.t("editor.error.appPathNotFound", {
        path: appPath
      })
    );
  }

  if (
    isUnsupportedCustomEditorApp({
      appPath,
      suggestedName: appName
    })
  ) {
    throw new Error(
      i18n.t("editor.error.unsupportedApp", {
        appName
      })
    );
  }
}

async function promptForCustomEditorFields(
  initialValues: Partial<CustomEditorInput>,
  prompt: PromptRunner,
  i18n: CliI18n
): Promise<CustomEditorInput> {
  const answers = await prompt<CustomEditorPromptAnswers>({
    type: "text",
    name: "name",
    message: i18n.t("editor.prompt.name"),
    initial: initialValues.name ?? "",
    validate: (value: string) => validateRequiredName(value, i18n)
  });
  const cliAnswer = await prompt<CustomEditorPromptAnswers>({
    type: "text",
    name: "cli",
    message: i18n.t("editor.prompt.cli"),
    initial: initialValues.cli ?? ""
  });
  const appPathAnswer = await prompt<CustomEditorPromptAnswers>({
    type: "text",
    name: "appPath",
    message: i18n.t("editor.prompt.appPath"),
    initial: initialValues.appPath ?? ""
  });
  const extensionsPathAnswer = await prompt<CustomEditorPromptAnswers>({
    type: "text",
    name: "extensionsPath",
    message: i18n.t("editor.prompt.extensionsPath"),
    initial: initialValues.extensionsPath ?? "",
    validate: (value: string) => validateRequiredPath(value, i18n)
  });
  const settingsPathAnswer = await prompt<CustomEditorPromptAnswers>({
    type: "text",
    name: "settingsPath",
    message: i18n.t("editor.prompt.settingsPath"),
    initial: initialValues.settingsPath ?? "",
    validate: (value: string) => validateRequiredPath(value, i18n)
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
  i18n: CliI18n,
  fallback?: Partial<CustomEditorInput>
): Promise<CustomEditorInput> {
  const merged = mergeCustomEditorOptions(options, fallback);
  const isComplete = Boolean(merged.name && merged.extensionsPath && merged.settingsPath);
  const finalInput = isComplete ? finalizeCustomEditorInput(merged) : await promptForCustomEditorFields(merged, prompt, i18n);

  if (normalizeFlagValue(finalInput.appPath)) {
    await ensureSupportedAppPath(finalInput.appPath ?? "", i18n);
  }

  return finalInput;
}

function printEditorsList(editors: CliEditor[], logger: CliLogger, i18n: CliI18n): void {
  if (editors.length === 0) {
    logger.line(logger.palette.yellow(i18n.t("editor.list.empty")));
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
    printDetail(i18n.t("editor.detail.source"), editor.source);
    printDetail(i18n.t("editor.detail.cli"), editor.cli || "-");
    printDetail(i18n.t("editor.detail.app"), editor.appPath ?? "-");
    printDetail(i18n.t("editor.detail.extensions"), editor.extensionsPath);
    printDetail(i18n.t("editor.detail.settings"), editor.settingsPath);

    if (index < editors.length - 1) {
      logger.line(logger.palette.dim("  " + "·".repeat(Math.min(detailWidth, 36))));
      logger.line();
    }
  }
}

export async function runEditorList(logger: CliLogger, i18n: CliI18n): Promise<number> {
  const editors = await resolveCliEditors(logger);
  printEditorsList(editors, logger, i18n);
  return 0;
}

export async function runEditorAdd(options: CliCommandOptions, logger: CliLogger, i18n: CliI18n): Promise<number> {
  const prompt = createPromptRunner();
  const input = await collectCustomEditorInput(options, prompt, i18n);
  const editors = await resolveCliEditors(logger);
  const created = await appendCustomEditor(input, {
    reservedEditors: toConflictCandidates(editors),
    reservedSlugs: editors.map((editor) => editor.slug)
  });

  logger.line(
    logger.palette.green(
      i18n.t("editor.saved", {
        displayName: created.displayName,
        slug: created.slug
      })
    )
  );
  return 0;
}

export async function runEditorUpdate(identifier: string, options: CliCommandOptions, logger: CliLogger, i18n: CliI18n): Promise<number> {
  const current = await findCustomEditorByIdOrSlug(identifier);

  if (!current) {
    logger.error(logger.palette.red(i18n.t("editor.error.notFound")));
    return 1;
  }

  const prompt = createPromptRunner();
  const input = await collectCustomEditorInput(options, prompt, i18n, {
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

  logger.line(
    logger.palette.green(
      i18n.t("editor.updated", {
        displayName: updated.displayName,
        slug: updated.slug
      })
    )
  );
  return 0;
}

export async function runEditorRemove(identifier: string, options: CliCommandOptions, logger: CliLogger, i18n: CliI18n): Promise<number> {
  const current = await findCustomEditorByIdOrSlug(identifier);

  if (!current) {
    logger.error(logger.palette.red(i18n.t("editor.error.notFound")));
    return 1;
  }

  if (!options.yes) {
    const prompt = createPromptRunner();
    const answer = await prompt<{ confirmed?: boolean }>({
      type: "confirm",
      name: "confirmed",
      initial: false,
      message: i18n.t("editor.confirmRemove", {
        displayName: current.displayName
      })
    });

    if (!answer.confirmed) {
      logger.line(logger.palette.yellow(i18n.t("common.cancelled")));
      return 0;
    }
  }

  await removeCustomEditor(current.id);
  logger.line(
    logger.palette.green(
      i18n.t("editor.removed", {
        displayName: current.displayName
      })
    )
  );
  return 0;
}
