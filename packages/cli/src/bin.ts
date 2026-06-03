import { CliLoggerImpl } from "./logger";

declare const __CLI_VERSION__: string;

function shouldPrintVersion(argv: string[]): boolean {
  return argv.includes("-v") || argv.includes("--version");
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

  const { runCli } = await import("./cli");
  process.exitCode = await runCli(process.argv);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown CLI error.";
  CliLoggerImpl.writeErrorLine(message);
  process.exitCode = 1;
});
