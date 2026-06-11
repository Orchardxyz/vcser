import { existsSync } from "node:fs";
import { rm } from "node:fs/promises";
import { resolveCustomEditorStorePath } from "@vcser/core/customEditors";
import { hasErrorCode, NODE_ERROR_CODE } from "@vcser/core/errors";
import type { CliLogger } from "../logger";
import type { CliI18n } from "../locales/i18n";
import { createPromptRunner, PromptCancelledError } from "../prompt";

export interface ResetCommandOptions {
  yes?: boolean;
}

async function confirmReset(logger: CliLogger, i18n: CliI18n, storePath: string, databasePath?: string): Promise<void> {
  const prompt = createPromptRunner();

  logger.line(logger.palette.yellow(i18n.t("reset.warning")));
  logger.line(
    logger.palette.dim(
      i18n.t("reset.customEditorStore", {
        path: storePath
      })
    )
  );

  if (databasePath) {
    logger.line(
      logger.palette.dim(
        i18n.t("reset.legacyDatabaseFiles", {
          path: databasePath
        })
      )
    );
  }

  logger.line();

  const answer = await prompt<{ confirmed?: boolean }>({
    type: "confirm",
    name: "confirmed",
    message: i18n.t("reset.confirm"),
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

export async function runResetCommand(options: ResetCommandOptions, logger: CliLogger, i18n: CliI18n): Promise<number> {
  const { resolveDatabasePathFromUrl, resolveDatabaseUrl } = await import("@vcser/core/dataPaths");
  const databaseUrl = resolveDatabaseUrl();
  const databasePath = resolveDatabasePathFromUrl(databaseUrl);
  const storePath = resolveCustomEditorStorePath();

  if (!options.yes) {
    await confirmReset(logger, i18n, storePath, databasePath);
  }

  const removedStoreCount = await removeDatabaseFiles(storePath);

  if (removedStoreCount === 0) {
    logger.line(
      logger.palette.yellow(
        i18n.t("reset.storeNotFound", {
          path: storePath
        })
      )
    );
  } else {
    logger.line(
      logger.palette.green(
        i18n.t("reset.storeRemoved", {
          path: storePath
        })
      )
    );
  }

  if (!databasePath) {
    logger.line(
      logger.palette.yellow(
        i18n.t("reset.databaseUrlNotFileBased", {
          databaseUrl
        })
      )
    );
    return 0;
  }

  const removedCount = await removeDatabaseFiles(databasePath);

  if (removedCount === 0) {
    logger.line(
      logger.palette.yellow(
        i18n.t("reset.databaseFilesNotFound", {
          path: databasePath
        })
      )
    );
    return 0;
  }

  logger.line(
    logger.palette.green(
      i18n.t("reset.databaseFilesRemoved", {
        path: databasePath
      })
    )
  );
  return 0;
}
