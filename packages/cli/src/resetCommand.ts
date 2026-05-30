import { existsSync } from "node:fs";
import { rm } from "node:fs/promises";
import type { CliLogger } from "./logger";
import { createPromptRunner, PromptCancelledError } from "./prompt";

export interface ResetCommandOptions {
  yes?: boolean;
}

async function confirmReset(logger: CliLogger, databasePath: string): Promise<void> {
  const prompt = createPromptRunner();

  logger.line(logger.palette.yellow("This will permanently remove the local vcser database."));
  logger.line(logger.palette.dim(databasePath));
  logger.line();

  const answer = await prompt<{ confirmed?: boolean }>({
    type: "confirm",
    name: "confirmed",
    message: "Delete this local database?",
    initial: false
  });

  if (!answer.confirmed) {
    throw new PromptCancelledError();
  }
}

async function removeDatabaseFiles(databasePath: string): Promise<number> {
  const candidatePaths = [databasePath, `${databasePath}-wal`, `${databasePath}-shm`];
  let removedCount = 0;

  for (const candidatePath of candidatePaths) {
    const existed = existsSync(candidatePath);
    try {
      await rm(candidatePath, { force: true });
      if (existed) {
        removedCount += 1;
      }
    } catch (error) {
      if (!(error instanceof Error) || !("code" in error) || error.code !== "ENOENT") {
        throw error;
      }
    }
  }

  return removedCount;
}

export async function runResetCommand(options: ResetCommandOptions, logger: CliLogger): Promise<number> {
  const { resolveDatabasePathFromUrl, resolveDatabaseUrl } = await import("@vcser/core/dataPaths");
  const databaseUrl = resolveDatabaseUrl();
  const databasePath = resolveDatabasePathFromUrl(databaseUrl);

  if (!databasePath) {
    logger.error(logger.palette.red(`Reset only supports file-based SQLite databases. Current DATABASE_URL: ${databaseUrl}`));
    return 1;
  }

  if (!options.yes) {
    await confirmReset(logger, databasePath);
  }

  const removedCount = await removeDatabaseFiles(databasePath);

  if (removedCount === 0) {
    logger.line(logger.palette.yellow(`No local database found at ${databasePath}.`));
    return 0;
  }

  logger.line(logger.palette.green(`Removed local database: ${databasePath}`));
  return 0;
}
