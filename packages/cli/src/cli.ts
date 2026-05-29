import { cac } from "cac";
import type { CliCommandOptions } from "./editorCommands";
import { createLogger } from "./logger";
import { PromptCancelledError } from "./prompt";

declare const __CLI_VERSION__: string;

interface CliOptions {
  color?: boolean;
  debug?: boolean;
  help?: boolean;
  version?: boolean;
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

function isCustomEditorStoreError(error: unknown): boolean {
  return error instanceof Error && error.name === "CustomEditorStoreError" && typeof (error as { code?: unknown }).code === "string";
}

export async function runCli(argv = process.argv): Promise<number> {
  const cli = cac("vscer");
  const version = readPackageVersion();

  cli.option("--no-color", "Disable color output");
  cli.option("--debug", "Print debug output");
  cli.option("-v, --version", "Display version number");
  cli.help();

  const parsed = cli.parse(argv, { run: false });
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

  const [scope, action, identifier] = parsed.args;
  const handleCancelled = () => logger.line(logger.palette.yellow("Cancelled."));
  const handleUnknownError = (message: string) => logger.error(logger.palette.red(message));

  if (!scope || scope === "sync") {
    const { runWizard } = await import("./syncWizard");
    return runWithCliErrorHandling(
      () => runWizard(logger),
      handleCancelled,
      (error) => handleUnknownError(String(error)),
      handleUnknownError
    );
  }

  if (scope !== "editor") {
    logger.error(logger.palette.red(`Unknown command: ${parsed.args.join(" ")}`));
    logger.line();
    cli.outputHelp();
    return 1;
  }

  const editorCommands = await import("./editorCommands");
  const commandOptions = parsed.options as CliCommandOptions;
  const handleStoreError = (error: unknown) => editorCommands.printCustomEditorError(logger, error);

  if (action === "list") {
    return runWithCliErrorHandling(() => editorCommands.runEditorList(logger), handleCancelled, handleStoreError, handleUnknownError);
  }

  if (action === "add") {
    return runWithCliErrorHandling(() => editorCommands.runEditorAdd(commandOptions, logger), handleCancelled, handleStoreError, handleUnknownError);
  }

  if (action === "update" && identifier) {
    return runWithCliErrorHandling(
      () => editorCommands.runEditorUpdate(identifier, commandOptions, logger),
      handleCancelled,
      handleStoreError,
      handleUnknownError
    );
  }

  if (action === "remove" && identifier) {
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
