import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const cwd = process.cwd();
const args = process.argv.slice(2);
const outputFlagIndex = args.findIndex((arg) => arg === "--output");
const customOutputPath = outputFlagIndex >= 0 ? args[outputFlagIndex + 1] : undefined;

if (outputFlagIndex >= 0 && !customOutputPath) {
  console.error("Missing value for --output");
  process.exit(1);
}

const statusPath = join(cwd, ".changeset", ".release-status.tmp.json");
const statusArgPath = relative(cwd, statusPath);
const outputPath = customOutputPath ? resolve(cwd, customOutputPath) : undefined;

const statusCommand = spawnSync("pnpm", ["exec", "changeset", "status", "--output", statusArgPath, "--verbose"], {
  cwd,
  encoding: "utf8"
});

if (statusCommand.status !== 0) {
  const noChangesetMessage = "no changesets were found";

  if (statusCommand.stderr.toLowerCase().includes(noChangesetMessage)) {
    const summary = {
      generatedAt: new Date().toISOString(),
      prerelease: null,
      releaseKind: "none",
      packageNames: [],
      releases: [],
      changesets: [],
      pendingChangesets: false,
      pendingChangesWithoutChangesets: true,
      notes: "No pending releases."
    };

    if (outputPath) {
      writeFileSync(outputPath, `${JSON.stringify(summary, null, 2)}\n`);
    }

    process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
    rmSync(statusPath, { force: true });
    process.exit(0);
  }

  process.stderr.write(statusCommand.stdout);
  process.stderr.write(statusCommand.stderr);
  rmSync(statusPath, { force: true });
  process.exit(statusCommand.status ?? 1);
}

const releasePlan = JSON.parse(readFileSync(statusPath, "utf8"));
const releases = Array.isArray(releasePlan.releases) ? releasePlan.releases.filter((release) => release.type !== "none") : [];
const changesets = Array.isArray(releasePlan.changesets) ? releasePlan.changesets : [];
const preState = releasePlan.preState ?? null;

const packageNames = releases.map((release) => release.name).filter((value) => typeof value === "string");

const desktopPackageName = "@vcser/desktop";
const npmPackageNames = packageNames.filter((name) => name !== desktopPackageName);
const desktopIncluded = packageNames.includes(desktopPackageName);

const releaseKind = desktopIncluded ? (npmPackageNames.length > 0 ? "combined" : "desktop-only") : npmPackageNames.length > 0 ? "npm-only" : "none";

const summary = {
  generatedAt: new Date().toISOString(),
  prerelease: preState
    ? {
        mode: preState.mode ?? "pre",
        tag: preState.tag ?? null,
        initialVersions: preState.initialVersions ?? {}
      }
    : null,
  releaseKind,
  packageNames,
  pendingChangesets: changesets.length > 0,
  pendingChangesWithoutChangesets: false,
  releases: releases.map((release) => ({
    name: release.name,
    type: release.type,
    oldVersion: release.oldVersion ?? null,
    newVersion: release.newVersion ?? null,
    changesets: Array.isArray(release.changesets) ? release.changesets : []
  })),
  changesets: changesets.map((changeset) => ({
    id: changeset.id,
    summary: changeset.summary,
    releases: Array.isArray(changeset.releases) ? changeset.releases : []
  })),
  notes: buildReleaseNotes({
    changesets,
    desktopIncluded,
    npmPackageNames,
    releases
  })
};

if (outputPath) {
  writeFileSync(outputPath, `${JSON.stringify(summary, null, 2)}\n`);
}

process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
rmSync(statusPath, { force: true });

function buildReleaseNotes({ changesets, desktopIncluded, npmPackageNames, releases }) {
  const lines = [];

  if (npmPackageNames.length > 0) {
    lines.push("## npm packages", "");

    for (const packageName of npmPackageNames) {
      lines.push(`### ${packageName}`);

      const release = releases.find((entry) => entry.name === packageName);
      if (release?.newVersion) {
        lines.push(`- Version: ${release.newVersion}`);
      }

      for (const entry of changesets) {
        const releaseEntry = Array.isArray(entry.releases) ? entry.releases.find((item) => item.name === packageName) : undefined;

        if (!releaseEntry) {
          continue;
        }

        lines.push(`- ${entry.summary}`);
      }

      if (!hasDirectChangeset(changesets, packageName)) {
        lines.push("- Internal dependency version update only.");
      }

      lines.push("");
    }
  }

  if (desktopIncluded) {
    lines.push("## desktop", "");
    lines.push("### @vcser/desktop");

    const release = releases.find((entry) => entry.name === "@vcser/desktop");
    if (release?.newVersion) {
      lines.push(`- Version: ${release.newVersion}`);
    }

    for (const entry of changesets) {
      const releaseEntry = Array.isArray(entry.releases) ? entry.releases.find((item) => item.name === "@vcser/desktop") : undefined;

      if (!releaseEntry) {
        continue;
      }

      lines.push(`- ${entry.summary}`);
    }

    if (!hasDirectChangeset(changesets, "@vcser/desktop")) {
      lines.push("- Internal dependency version update only.");
    }

    lines.push("");
  }

  if (lines.length === 0) {
    lines.push("No pending releases.");
  }

  return lines.join("\n").trimEnd();
}

function hasDirectChangeset(changesets, packageName) {
  return changesets.some((entry) => (Array.isArray(entry.releases) ? entry.releases.some((item) => item.name === packageName) : false));
}
