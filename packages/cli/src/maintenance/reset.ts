import { existsSync } from "node:fs";
import { rm } from "node:fs/promises";
import { resolveCustomEditorStorePath } from "@vcser/core/customEditors";
import { hasErrorCode, NODE_ERROR_CODE } from "@vcser/core/errors";
import type { CliLogger } from "../logger";
import { createPromptRunner, PromptCancelledError } from "../prompt";

export interface ResetCommandOptions {
  yes?: boolean;
}

async function confirmReset(logger: CliLogger, storePath: string, databasePath?: string): Promise<void> {
  const prompt = createPromptRunner();

  logger.line(logger.palette.yellow("This will permanently remove local vcser state."));
  logger.line(logger.palette.dim(`Custom editor store: ${storePath}`));

  if (databasePath) {
    logger.line(logger.palette.dim(`Legacy database files: ${databasePath}`));
  }

  logger.line();

  const answer = await prompt<{ confirmed?: boolean }>({
    type: "confirm",
    name: "confirmed",
    message: "Delete this local state?",
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
      if (!hasErrorCode(error, NODE_ERROR_CODE.ENOENT)) {
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
  const storePath = resolveCustomEditorStorePath();

  if (!options.yes) {
    await confirmReset(logger, storePath, databasePath);
  }

  const removedStoreCount = await removeDatabaseFiles(storePath);

  if (removedStoreCount === 0) {
    logger.line(logger.palette.yellow(`No custom editor store found at ${storePath}.`));
  } else {
    logger.line(logger.palette.green(`Removed custom editor store: ${storePath}`));
  }

  if (!databasePath) {
    logger.line(logger.palette.yellow(`Skipped legacy database cleanup because DATABASE_URL is not file-based: ${databaseUrl}`));
    return 0;
  }

  const removedCount = await removeDatabaseFiles(databasePath);

  if (removedCount === 0) {
    logger.line(logger.palette.yellow(`No legacy database files found at ${databasePath}.`));
    return 0;
  }

  logger.line(logger.palette.green(`Removed legacy database files: ${databasePath}`));
  return 0;
}
