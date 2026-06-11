import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resolveCustomEditorStorePath } from "@vcser/core/customEditors";
import { APP_LOCALE } from "@vcser/core/i18n";
import { createCliI18n } from "../src/locales/i18n";
import type { CliLogger } from "../src/logger";
import { runMigrateCustomEditorsCommand } from "../src/maintenance/migrateCustomEditors";

const i18n = createCliI18n(APP_LOCALE.EN);

const { execFileMock, execFilePromiseMock } = vi.hoisted(() => ({
  execFileMock: vi.fn(),
  execFilePromiseMock: vi.fn()
}));

vi.mock("node:child_process", () => ({
  execFile: Object.assign(execFileMock, {
    [Symbol.for("nodejs.util.promisify.custom")]: execFilePromiseMock
  })
}));

interface ExecResult {
  stdout?: string;
  stderr?: string;
  error?: Error & { code?: string };
  beforeCallback?: () => void;
}

function queueExecResults(results: ExecResult[]) {
  execFilePromiseMock.mockImplementation(async () => {
    const next = results.shift();

    if (!next) {
      throw new Error("Unexpected sqlite3 invocation.");
    }

    next.beforeCallback?.();
    if (next.error) {
      throw next.error;
    }

    return {
      stdout: next.stdout ?? "",
      stderr: next.stderr ?? ""
    };
  });
}

function createTestLogger() {
  const lines: string[] = [];
  const errors: string[] = [];
  const passthrough = (value: string) => value;

  const logger = {
    palette: {
      brand: passthrough,
      cyan: passthrough,
      dim: passthrough,
      green: passthrough,
      red: passthrough,
      yellow: passthrough
    },
    banner() {},
    line(message = "") {
      lines.push(message);
    },
    error(message: string) {
      errors.push(message);
    },
    debug() {},
    inventorySummary() {},
    syncSummary() {},
    table() {},
    settingsSyncApplied() {}
  } satisfies CliLogger;

  return { logger, lines, errors };
}

describe("runMigrateCustomEditorsCommand", () => {
  let tempHome: string;
  let originalHome: string | undefined;
  let originalDatabaseUrl: string | undefined;
  let storeDirPath: string;
  let storeFilePath: string;
  let databasePath: string;

  beforeEach(() => {
    originalHome = process.env.HOME;
    originalDatabaseUrl = process.env.DATABASE_URL;
    tempHome = mkdtempSync(join(tmpdir(), "vcser-cli-migrate-"));
    databasePath = join(tempHome, "legacy.db");
    process.env.HOME = tempHome;
    process.env.DATABASE_URL = `file:${databasePath}`;
    storeDirPath = join(tempHome, ".vcser");
    storeFilePath = resolveCustomEditorStorePath();
    execFileMock.mockReset();
    execFilePromiseMock.mockReset();
  });

  afterEach(() => {
    try {
      if (existsSync(storeDirPath)) {
        chmodSync(storeDirPath, 0o700);
      }
    } catch {
      // ignore permission reset failures during cleanup
    }

    rmSync(tempHome, { recursive: true, force: true });

    if (originalHome === undefined) {
      delete process.env.HOME;
    } else {
      process.env.HOME = originalHome;
    }

    if (originalDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = originalDatabaseUrl;
    }
  });

  it("imports legacy rows, skips duplicates, and cleans the legacy table only after the JSON write succeeds", async () => {
    mkdirSync(storeDirPath, { recursive: true });
    writeFileSync(
      storeFilePath,
      `${JSON.stringify(
        {
          version: 1,
          editors: [
            {
              id: "existing-id",
              slug: "custom-existing",
              name: "Existing",
              displayName: "Existing",
              extensionsPath: "/tmp/existing/extensions",
              settingsPath: "/tmp/existing/settings.json",
              createdAt: "2026-01-01T00:00:00.000Z"
            }
          ]
        },
        null,
        2
      )}\n`,
      "utf8"
    );

    queueExecResults([
      { stdout: "3.45.0\n" },
      { stdout: "1\n" },
      {
        stdout: [
          JSON.stringify({
            id: "legacy-id-1",
            slug: "custom-legacy",
            name: "Legacy",
            displayName: "Legacy",
            cli: "legacy",
            appPath: "/Applications/Legacy.app",
            extensionsPath: "/tmp/legacy/extensions",
            settingsPath: "/tmp/legacy/settings.json",
            createdAt: "2026-02-01T00:00:00.000Z"
          }),
          JSON.stringify({
            id: "legacy-id-2",
            slug: "custom-duplicate",
            name: "Existing",
            displayName: "Existing",
            extensionsPath: "/tmp/existing/extensions",
            settingsPath: "/tmp/existing/settings.json",
            createdAt: "2026-02-02T00:00:00.000Z"
          })
        ].join("\n")
      },
      {
        beforeCallback: () => {
          const contents = readFileSync(storeFilePath, "utf8");
          expect(contents).toContain("custom-legacy");
        }
      }
    ]);

    const { logger, lines } = createTestLogger();
    await expect(runMigrateCustomEditorsCommand(logger, i18n)).resolves.toBe(0);

    const parsed = JSON.parse(readFileSync(storeFilePath, "utf8")) as { editors: Array<{ slug: string }> };
    expect(parsed.editors).toHaveLength(2);
    expect(parsed.editors.map((editor) => editor.slug)).toEqual(["custom-existing", "custom-legacy"]);
    expect(lines.some((line) => line.includes("Imported 1 legacy custom editor"))).toBe(true);
    expect(lines.some((line) => line.includes("Skipped 1 duplicate legacy record"))).toBe(true);
  });

  it("returns cleanly when no legacy CustomEditor table exists", async () => {
    queueExecResults([{ stdout: "3.45.0\n" }, { stdout: "" }]);

    const { logger, lines } = createTestLogger();
    await expect(runMigrateCustomEditorsCommand(logger, i18n)).resolves.toBe(0);
    expect(lines.some((line) => line.includes("No legacy CustomEditor table found"))).toBe(true);
    expect(execFilePromiseMock).toHaveBeenCalledTimes(2);
  });

  it("fails with a clear error when sqlite3 is unavailable", async () => {
    const error = new Error("sqlite3 missing") as Error & { code?: string };
    error.code = "ENOENT";
    queueExecResults([{ error }]);

    const { logger } = createTestLogger();
    await expect(runMigrateCustomEditorsCommand(logger, i18n)).rejects.toThrow("sqlite3 command is required");
  });

  it("refuses to clean the legacy table when all legacy rows are invalid", async () => {
    queueExecResults([
      { stdout: "3.45.0\n" },
      { stdout: "1\n" },
      {
        stdout: JSON.stringify({
          id: "legacy-id-1",
          slug: "custom-legacy",
          name: "",
          displayName: "Legacy",
          extensionsPath: "/tmp/legacy/extensions",
          settingsPath: "/tmp/legacy/settings.json",
          createdAt: "2026-02-01T00:00:00.000Z"
        })
      }
    ]);

    const { logger } = createTestLogger();
    await expect(runMigrateCustomEditorsCommand(logger, i18n)).rejects.toThrow("only invalid rows");
    expect(execFilePromiseMock).toHaveBeenCalledTimes(3);
  });

  it("does not clean the legacy table if writing the JSON store fails", async () => {
    mkdirSync(storeDirPath, { recursive: true });
    writeFileSync(storeFilePath, `${JSON.stringify({ version: 1, editors: [] }, null, 2)}\n`, "utf8");

    queueExecResults([
      { stdout: "3.45.0\n" },
      { stdout: "1\n" },
      {
        stdout: JSON.stringify({
          id: "legacy-id-1",
          slug: "custom-legacy",
          name: "Legacy",
          displayName: "Legacy",
          extensionsPath: "/tmp/legacy/extensions",
          settingsPath: "/tmp/legacy/settings.json",
          createdAt: "2026-02-01T00:00:00.000Z"
        }),
        beforeCallback: () => {
          chmodSync(storeDirPath, 0o500);
        }
      }
    ]);

    const { logger } = createTestLogger();
    await expect(runMigrateCustomEditorsCommand(logger, i18n)).rejects.toThrow();
    expect(execFilePromiseMock).toHaveBeenCalledTimes(3);
    expect(readFileSync(storeFilePath, "utf8")).toBe(`${JSON.stringify({ version: 1, editors: [] }, null, 2)}\n`);
  });
});
