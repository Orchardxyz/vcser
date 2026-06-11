import { cac } from "cac";
import { isCustomEditorStoreError } from "@vcser/core/customEditors";
import type { CliCommandOptions } from "./editor/commands";
import { createCliI18n, resolveCliLocale } from "./locales/i18n";
import { CLI_EDITOR_ACTION, CLI_MIGRATION_TARGET, CLI_SCOPE } from "./commandConstants";
import { createLogger } from "./logger";
import { PromptCancelledError } from "./prompt";

declare const __CLI_VERSION__: string;

interface CliOptions {
  color?: boolean;
  debug?: boolean;
  help?: boolean;
  locale?: string;
  version?: boolean;
  yes?: boolean;
  [key: string]: unknown;
}

function normalizeCliOptions(options: CliOptions): Required<Pick<CliOptions, "color" | "debug">> {
  return {
    color: options.color !== false,
    debug: Boolean(options.debug)
  };
}

function readPackageVersion(): string {
  return __CLI_VERSION__;
}

function normalizeArgv(argv: readonly string[]): string[] {
  if (argv[2] !== "--") {
    return [...argv];
  }

  return [argv[0] ?? "", argv[1] ?? "", ...argv.slice(3)];
}

async function runWithCliErrorHandling(
  task: () => Promise<number>,
  onCancelled: () => void,
  onStoreError: (error: unknown) => void,
  onUnknownError: (message: string) => void,
  unknownErrorMessage: string
): Promise<number> {
  try {
    return await task();
  } catch (error) {
    if (error instanceof PromptCancelledError) {
      onCancelled();
      return 0;
    }

    if (isCustomEditorStoreError(error)) {
      onStoreError(error);
      return 1;
    }

    const message = error instanceof Error ? error.message : unknownErrorMessage;
    onUnknownError(message);
    return 1;
  }
}

function registerCommands(cli: ReturnType<typeof cac>, i18n: ReturnType<typeof createCliI18n>): void {
  cli.command(CLI_SCOPE.SYNC, i18n.t("cli.command.syncDescription"));
  cli.command(CLI_SCOPE.RESET, i18n.t("cli.command.resetDescription"));
  cli.command(`${CLI_SCOPE.MIGRATE} <target>`, i18n.t("cli.command.migrateDescription"));

  cli
    .command(`${CLI_SCOPE.EDITOR} <action> [identifier]`, i18n.t("cli.command.editorDescription"))
    .option("--name <name>", i18n.t("cli.option.editorName"))
    .option("--cli <command>", i18n.t("cli.option.editorCli"))
    .option("--app-path <path>", i18n.t("cli.option.editorAppPath"))
    .option("--extensions-path <path>", i18n.t("cli.option.editorExtensionsPath"))
    .option("--settings-path <path>", i18n.t("cli.option.editorSettingsPath"));

  cli.example((name) => `  ${name} ${CLI_SCOPE.EDITOR} ${CLI_EDITOR_ACTION.LIST}`);
  cli.example((name) => `  ${name} ${CLI_SCOPE.EDITOR} ${CLI_EDITOR_ACTION.ADD}`);
  cli.example((name) => `  ${name} ${CLI_SCOPE.EDITOR} ${CLI_EDITOR_ACTION.UPDATE} <identifier>`);
  cli.example((name) => `  ${name} ${CLI_SCOPE.EDITOR} ${CLI_EDITOR_ACTION.REMOVE} <identifier>`);
  cli.example((name) => `  ${name} ${CLI_SCOPE.MIGRATE} ${CLI_MIGRATION_TARGET.CUSTOM_EDITORS}`);
}

function resolveCommandArgs(cli: ReturnType<typeof cac>, args: readonly string[]): readonly string[] {
  return cli.matchedCommandName ? [cli.matchedCommandName, ...args] : args;
}

export async function runCli(argv = process.argv): Promise<number> {
  const normalizedArgv = normalizeArgv(argv);
  const i18n = createCliI18n(resolveCliLocale({ argv: normalizedArgv }));
  const cli = cac("vcser");
  const version = readPackageVersion();

  cli.option("--no-color", i18n.t("cli.option.disableColor"));
  cli.option("--debug", i18n.t("cli.option.debug"));
  cli.option("-y, --yes", i18n.t("cli.option.yes"));
  cli.option("-v, --version", i18n.t("cli.option.version"));
  cli.option("--locale <locale>", i18n.t("cli.option.locale"));
  registerCommands(cli, i18n);
  cli.help();

  const parsed = cli.parse(normalizedArgv, { run: false });
  const options = normalizeCliOptions(parsed.options as CliOptions);
  const logger = createLogger({
    colorEnabled: options.color,
    debugEnabled: options.debug,
    i18n
  });

  if ((parsed.options as CliOptions).version) {
    logger.line(version);
    return 0;
  }

  if ((parsed.options as CliOptions).help) {
    return 0;
  }

  const [scope, action, identifier] = resolveCommandArgs(cli, parsed.args);
  const handleCancelled = () => logger.line(logger.palette.yellow(i18n.t("common.cancelled")));
  const handleUnknownError = (message: string) => logger.error(logger.palette.red(message));
  const unknownErrorMessage = i18n.t("common.unknownCliError");

  if (!scope || scope === CLI_SCOPE.SYNC) {
    const { runWizard } = await import("./sync/wizard");
    return runWithCliErrorHandling(
      () => runWizard(logger, i18n),
      handleCancelled,
      (error) => handleUnknownError(String(error)),
      handleUnknownError,
      unknownErrorMessage
    );
  }

  if (scope === CLI_SCOPE.RESET) {
    const { runResetCommand } = await import("./maintenance/reset");
    return runWithCliErrorHandling(
      () => runResetCommand({ yes: Boolean((parsed.options as CliOptions).yes) }, logger, i18n),
      handleCancelled,
      (error) => handleUnknownError(String(error)),
      handleUnknownError,
      unknownErrorMessage
    );
  }

  if (scope === CLI_SCOPE.MIGRATE) {
    if (action !== CLI_MIGRATION_TARGET.CUSTOM_EDITORS) {
      logger.error(
        logger.palette.red(
          i18n.t("cli.unknownCommand", {
            command: parsed.args.join(" ")
          })
        )
      );
      logger.line();
      cli.outputHelp();
      return 1;
    }

    const { runMigrateCustomEditorsCommand } = await import("./maintenance/migrateCustomEditors");
    return runWithCliErrorHandling(
      () => runMigrateCustomEditorsCommand(logger, i18n),
      handleCancelled,
      (error) => handleUnknownError(error instanceof Error ? error.message : String(error)),
      handleUnknownError,
      unknownErrorMessage
    );
  }

  const editorCommands = await import("./editor/commands");
  const commandOptions = parsed.options as CliCommandOptions;
  const handleStoreError = (error: unknown) => editorCommands.printCustomEditorError(logger, error, i18n);

  if (scope !== CLI_SCOPE.EDITOR) {
    logger.error(
      logger.palette.red(
        i18n.t("cli.unknownCommand", {
          command: parsed.args.join(" ")
        })
      )
    );
    logger.line();
    cli.outputHelp();
    return 1;
  }

  if (action === CLI_EDITOR_ACTION.LIST) {
    return runWithCliErrorHandling(
      () => editorCommands.runEditorList(logger, i18n),
      handleCancelled,
      handleStoreError,
      handleUnknownError,
      unknownErrorMessage
    );
  }

  if (action === CLI_EDITOR_ACTION.ADD) {
    return runWithCliErrorHandling(
      () => editorCommands.runEditorAdd(commandOptions, logger, i18n),
      handleCancelled,
      handleStoreError,
      handleUnknownError,
      unknownErrorMessage
    );
  }

  if (action === CLI_EDITOR_ACTION.UPDATE && identifier) {
    return runWithCliErrorHandling(
      () => editorCommands.runEditorUpdate(identifier, commandOptions, logger, i18n),
      handleCancelled,
      handleStoreError,
      handleUnknownError,
      unknownErrorMessage
    );
  }

  if (action === CLI_EDITOR_ACTION.REMOVE && identifier) {
    return runWithCliErrorHandling(
      () => editorCommands.runEditorRemove(identifier, commandOptions, logger, i18n),
      handleCancelled,
      handleStoreError,
      handleUnknownError,
      unknownErrorMessage
    );
  }

  logger.error(
    logger.palette.red(
      i18n.t("cli.unknownCommand", {
        command: parsed.args.join(" ")
      })
    )
  );
  logger.line();
  cli.outputHelp();
  return 1;
}
