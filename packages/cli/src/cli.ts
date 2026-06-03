import { cac } from "cac";
import { isCustomEditorStoreError } from "@vcser/core/customEditors";
import type { CliCommandOptions } from "./editorCommands";
import { CLI_EDITOR_ACTION, CLI_MIGRATION_TARGET, CLI_SCOPE } from "./commandConstants";
import { createLogger } from "./logger";
import { PromptCancelledError } from "./prompt";

declare const __CLI_VERSION__: string;

interface CliOptions {
  color?: boolean;
  debug?: boolean;
  help?: boolean;
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
  onUnknownError: (message: string) => void
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

    const message = error instanceof Error ? error.message : "Unknown CLI error.";
    onUnknownError(message);
    return 1;
  }
}

function registerCommands(cli: ReturnType<typeof cac>): void {
  cli.command(CLI_SCOPE.SYNC, "Start the interactive extension sync wizard");
  cli.command(CLI_SCOPE.RESET, "Reset local vcser state");
  cli.command(`${CLI_SCOPE.MIGRATE} <target>`, "Run one-off vcser data migrations");

  cli
    .command(`${CLI_SCOPE.EDITOR} <action> [identifier]`, "Manage detected and custom editors")
    .option("--name <name>", "Editor display name")
    .option("--cli <command>", "Editor CLI command")
    .option("--app-path <path>", "Editor application path")
    .option("--extensions-path <path>", "Editor extensions directory")
    .option("--settings-path <path>", "Editor settings file");

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
  const cli = cac("vcser");
  const version = readPackageVersion();

  cli.option("--no-color", "Disable color output");
  cli.option("--debug", "Print debug output");
  cli.option("-y, --yes", "Skip confirmation prompts");
  cli.option("-v, --version", "Display version number");
  registerCommands(cli);
  cli.help();

  const parsed = cli.parse(normalizedArgv, { run: false });
  const options = normalizeCliOptions(parsed.options as CliOptions);
  const logger = createLogger({
    colorEnabled: options.color,
    debugEnabled: options.debug
  });

  if ((parsed.options as CliOptions).version) {
    logger.line(version);
    return 0;
  }

  if ((parsed.options as CliOptions).help) {
    return 0;
  }

  const [scope, action, identifier] = resolveCommandArgs(cli, parsed.args);
  const handleCancelled = () => logger.line(logger.palette.yellow("Cancelled."));
  const handleUnknownError = (message: string) => logger.error(logger.palette.red(message));

  if (!scope || scope === CLI_SCOPE.SYNC) {
    const { runWizard } = await import("./syncWizard");
    return runWithCliErrorHandling(
      () => runWizard(logger),
      handleCancelled,
      (error) => handleUnknownError(String(error)),
      handleUnknownError
    );
  }

  if (scope === CLI_SCOPE.RESET) {
    const { runResetCommand } = await import("./resetCommand");
    return runWithCliErrorHandling(
      () => runResetCommand({ yes: Boolean((parsed.options as CliOptions).yes) }, logger),
      handleCancelled,
      (error) => handleUnknownError(String(error)),
      handleUnknownError
    );
  }

  if (scope === CLI_SCOPE.MIGRATE) {
    if (action !== CLI_MIGRATION_TARGET.CUSTOM_EDITORS) {
      logger.error(logger.palette.red(`Unknown command: ${parsed.args.join(" ")}`));
      logger.line();
      cli.outputHelp();
      return 1;
    }

    const { runMigrateCustomEditorsCommand } = await import("./migrateCustomEditorsCommand");
    return runWithCliErrorHandling(
      () => runMigrateCustomEditorsCommand(logger),
      handleCancelled,
      (error) => handleUnknownError(error instanceof Error ? error.message : String(error)),
      handleUnknownError
    );
  }

  const editorCommands = await import("./editorCommands");
  const commandOptions = parsed.options as CliCommandOptions;
  const handleStoreError = (error: unknown) => editorCommands.printCustomEditorError(logger, error);

  if (scope !== CLI_SCOPE.EDITOR) {
    logger.error(logger.palette.red(`Unknown command: ${parsed.args.join(" ")}`));
    logger.line();
    cli.outputHelp();
    return 1;
  }

  if (action === CLI_EDITOR_ACTION.LIST) {
    return runWithCliErrorHandling(() => editorCommands.runEditorList(logger), handleCancelled, handleStoreError, handleUnknownError);
  }

  if (action === CLI_EDITOR_ACTION.ADD) {
    return runWithCliErrorHandling(() => editorCommands.runEditorAdd(commandOptions, logger), handleCancelled, handleStoreError, handleUnknownError);
  }

  if (action === CLI_EDITOR_ACTION.UPDATE && identifier) {
    return runWithCliErrorHandling(
      () => editorCommands.runEditorUpdate(identifier, commandOptions, logger),
      handleCancelled,
      handleStoreError,
      handleUnknownError
    );
  }

  if (action === CLI_EDITOR_ACTION.REMOVE && identifier) {
    return runWithCliErrorHandling(
      () => editorCommands.runEditorRemove(identifier, commandOptions, logger),
      handleCancelled,
      handleStoreError,
      handleUnknownError
    );
  }

  logger.error(logger.palette.red(`Unknown command: ${parsed.args.join(" ")}`));
  logger.line();
  cli.outputHelp();
  return 1;
}
