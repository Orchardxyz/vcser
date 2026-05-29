import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";

const workspaceRoot = process.cwd();
const prereleaseTag = "beta";
const tempDir = mkdtempSync(join(tmpdir(), "vcser-release-"));
const outputPath = join(tempDir, "release-plan.json");

try {
  const previewCommand = spawnSync("node", ["./scripts/release/preview-release.mjs", "--output", outputPath], {
    cwd: workspaceRoot,
    encoding: "utf8"
  });

  if (previewCommand.status !== 0) {
    process.stderr.write(previewCommand.stdout);
    process.stderr.write(previewCommand.stderr);
    process.exit(previewCommand.status ?? 1);
  }

  const summary = JSON.parse(readFileSync(outputPath, "utf8"));

  if (!summary.pendingChangesets) {
    const reason = summary.pendingChangesWithoutChangesets
      ? "Package changes were detected, but no changeset files exist yet."
      : "No pending release changesets were found.";

    process.stderr.write([reason, "Add the changesets you want to publish before entering prerelease mode."].join("\n"));
    process.stderr.write("\n");
    process.exit(1);
  }

  const packageList = Array.isArray(summary.packageNames) ? summary.packageNames : [];
  process.stdout.write(
    [
      `Entering repository-wide prerelease mode with tag "${prereleaseTag}".`,
      `Packages in the current release plan: ${packageList.length > 0 ? packageList.join(", ") : "(none)"}`
    ].join("\n")
  );
  process.stdout.write("\n");

  const enterCommand = spawnSync("pnpm", ["exec", "changeset", "pre", "enter", prereleaseTag], {
    cwd: workspaceRoot,
    stdio: "inherit"
  });

  process.exit(enterCommand.status ?? 1);
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
