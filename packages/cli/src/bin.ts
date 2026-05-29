import { CliLoggerImpl } from "./logger";
import { ensureNodeNativeModulesReady } from "./nativeRebuild";

declare const __CLI_VERSION__: string;

function shouldPrintVersion(argv: string[]): boolean {
  return argv.includes("-v") || argv.includes("--version");
}

function shouldSkipNativeSetup(argv: string[]): boolean {
  return shouldPrintVersion(argv) || argv.includes("-h") || argv.includes("--help");
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);

  if (shouldPrintVersion(argv)) {
    const logger = new CliLoggerImpl({
      colorEnabled: true,
      debugEnabled: false
    });
    logger.line(__CLI_VERSION__);
    return;
  }

  if (!shouldSkipNativeSetup(argv)) {
    ensureNodeNativeModulesReady();
  }

  const { runCli } = await import("./cli");
  process.exitCode = await runCli(process.argv);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown CLI error.";
  CliLoggerImpl.writeErrorLine(message);
  process.exitCode = 1;
});
