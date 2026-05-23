import { CliLoggerImpl } from "./logger";
import { ensureNodeNativeModulesReady } from "./nativeRebuild";

async function main(): Promise<void> {
  ensureNodeNativeModulesReady();
  const { runCli } = await import("./cli");
  process.exitCode = await runCli(process.argv);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown CLI error.";
  CliLoggerImpl.writeErrorLine(message);
  process.exitCode = 1;
});
