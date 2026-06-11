import { CliLoggerImpl } from "./logger";
import { createCliI18n, resolveCliLocale } from "./locales/i18n";

declare const __CLI_VERSION__: string;

function shouldPrintVersion(argv: string[]): boolean {
  return argv.includes("-v") || argv.includes("--version");
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const i18n = createCliI18n(resolveCliLocale({ argv: process.argv }));

  if (shouldPrintVersion(argv)) {
    const logger = new CliLoggerImpl({
      colorEnabled: true,
      debugEnabled: false,
      i18n
    });
    logger.line(__CLI_VERSION__);
    return;
  }

  const { runCli } = await import("./cli");
  process.exitCode = await runCli(process.argv);
}

main().catch((error: unknown) => {
  const i18n = createCliI18n(resolveCliLocale({ argv: process.argv }));
  const message = error instanceof Error ? error.message : i18n.t("common.unknownCliError");
  CliLoggerImpl.writeErrorLine(message);
  process.exitCode = 1;
});
