import { CliLoggerImpl } from "./logger.js";
import { runCli } from "./cli.js";

async function main(): Promise<void> {
  process.exitCode = await runCli(process.argv);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown CLI error.";
  CliLoggerImpl.writeErrorLine(message);
  process.exitCode = 1;
});
