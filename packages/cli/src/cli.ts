import { cac } from "cac";
import { CustomEditorStoreError } from "@vcser/core/customEditors";
import {
  runEditorAdd,
  runEditorList,
  runEditorRemove,
  runEditorUpdate,
  type CliCommandOptions,
  printCustomEditorError,
  PromptCancelledError
} from "./editorCommands";
import { createLogger } from "./logger";
import { runWizard } from "./syncWizard";

declare const __CLI_VERSION__: string;

interface CliOptions {
  color?: boolean;
  debug?: boolean;
  help?: boolean;
  version?: boolean;
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
  onStoreError: (error: CustomEditorStoreError) => void,
  onUnknownError: (message: string) => void
): Promise<number> {
  try {
    return await task();
  } catch (error) {
    if (error instanceof PromptCancelledError) {
      onCancelled();
      return 0;
    }

    if (error instanceof CustomEditorStoreError) {
      onStoreError(error);
      return 1;
    }

    const message = error instanceof Error ? error.message : "Unknown CLI error.";
    onUnknownError(message);
    return 1;
  }
}

export async function runCli(argv = process.argv): Promise<number> {
  const cli = cac("vscer");
  const version = readPackageVersion();

  cli.option("--no-color", "Disable color output");
  cli.option("--debug", "Print debug output");
  cli.help();
  cli.version(version);

  const parsed = cli.parse(argv, { run: false });
  const options = normalizeCliOptions(parsed.options as CliOptions);
  const logger = createLogger({
    colorEnabled: options.color,
    debugEnabled: options.debug
  });

  if ((parsed.options as CliOptions).help || (parsed.options as CliOptions).version) {
    return 0;
  }

  const [scope, action, identifier] = parsed.args;
  const commandOptions = parsed.options as CliCommandOptions;
  const handleCancelled = () => logger.line(logger.palette.yellow("Cancelled."));
  const handleStoreError = (error: CustomEditorStoreError) => printCustomEditorError(logger, error);
  const handleUnknownError = (message: string) => logger.error(logger.palette.red(message));

  if (!scope) {
    return runWithCliErrorHandling(() => runWizard(logger), handleCancelled, handleStoreError, handleUnknownError);
  }

  if (scope !== "editor") {
    logger.error(logger.palette.red(`Unknown command: ${parsed.args.join(" ")}`));
    logger.line();
    cli.outputHelp();
    return 1;
  }

  if (action === "list") {
    return runWithCliErrorHandling(() => runEditorList(logger), handleCancelled, handleStoreError, handleUnknownError);
  }

  if (action === "add") {
    return runWithCliErrorHandling(() => runEditorAdd(commandOptions, logger), handleCancelled, handleStoreError, handleUnknownError);
  }

  if (action === "update" && identifier) {
    return runWithCliErrorHandling(() => runEditorUpdate(identifier, commandOptions, logger), handleCancelled, handleStoreError, handleUnknownError);
  }

  if (action === "remove" && identifier) {
    return runWithCliErrorHandling(() => runEditorRemove(identifier, commandOptions, logger), handleCancelled, handleStoreError, handleUnknownError);
  }

  logger.error(logger.palette.red(`Unknown command: ${parsed.args.join(" ")}`));
  logger.line();
  cli.outputHelp();
  return 1;
}
