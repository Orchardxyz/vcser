import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const workspaceRoot = process.cwd();
const args = parseArgs(process.argv.slice(2));
const mode = args.mode ?? "committed";
const metadataPath = args.metadata ? resolve(workspaceRoot, args.metadata) : undefined;
const notesPath = args.notes ? resolve(workspaceRoot, args.notes) : undefined;
const githubOutputPath = args.githubOutput ?? process.env.GITHUB_OUTPUT;

const packages = [
  { name: "@vcser/core", path: "packages/core/package.json", group: "npm" },
  { name: "@vcser/cli", path: "packages/cli/package.json", group: "npm" },
  { name: "@vcser/desktop", path: "apps/desktop/package.json", group: "desktop" }
];

const metadata = mode === "pending" ? resolvePendingRelease() : resolveCommittedRelease(args.baseRef ?? "HEAD^", args.headRef ?? "HEAD");

if (metadataPath) {
  writeTextFile(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`);
}

if (notesPath) {
  writeTextFile(notesPath, `${metadata.notes}\n`);
}

if (githubOutputPath) {
  writeGithubOutputs(githubOutputPath, metadata);
}

process.stdout.write(`${JSON.stringify(metadata, null, 2)}\n`);

function resolveCommittedRelease(baseRef, headRef) {
  const releases = [];

  for (const packageInfo of packages) {
    const currentPackage = readPackageAtRef(headRef, packageInfo.path);
    const previousPackage = readPackageAtRef(baseRef, packageInfo.path);

    if (!currentPackage) {
      continue;
    }

    const currentVersion = currentPackage.version;
    const previousVersion = previousPackage?.version ?? null;

    if (typeof currentVersion !== "string" || currentVersion === previousVersion) {
      continue;
    }

    releases.push({
      name: packageInfo.name,
      group: packageInfo.group,
      oldVersion: previousVersion,
      newVersion: currentVersion,
      changelog: readChangelogSection(packageInfo.path, currentVersion)
    });
  }

  return buildMetadata({
    mode: "committed",
    releases,
    pendingChangesets: false,
    pendingChangesWithoutChangesets: false
  });
}

function resolvePendingRelease() {
  const previewPath = join(workspaceRoot, ".changeset", ".release-preview.tmp.json");
  try {
    const previewCommand = spawnSync("node", ["./scripts/release/preview-release.mjs", "--output", relative(workspaceRoot, previewPath)], {
      cwd: workspaceRoot,
      encoding: "utf8"
    });

    if (previewCommand.status !== 0) {
      process.stderr.write(previewCommand.stdout);
      process.stderr.write(previewCommand.stderr);
      process.exit(previewCommand.status ?? 1);
    }

    const preview = JSON.parse(readFileSync(previewPath, "utf8"));
    const releases = Array.isArray(preview.releases)
      ? preview.releases.map((release) => ({
          name: release.name,
          group: release.name === "@vcser/desktop" ? "desktop" : "npm",
          oldVersion: release.oldVersion ?? null,
          newVersion: release.newVersion ?? null,
          changelog: null
        }))
      : [];

    return buildMetadata({
      mode: "pending",
      releases,
      pendingChangesets: Boolean(preview.pendingChangesets),
      pendingChangesWithoutChangesets: Boolean(preview.pendingChangesWithoutChangesets),
      prerelease: preview.prerelease ?? null,
      previewNotes: typeof preview.notes === "string" ? preview.notes : undefined
    });
  } finally {
    rmSync(previewPath, { force: true });
  }
}

function buildMetadata({ mode, releases, pendingChangesets, pendingChangesWithoutChangesets, prerelease, previewNotes }) {
  const packageNames = releases.map((release) => release.name);
  const npmReleases = releases.filter((release) => release.group === "npm");
  const desktopReleases = releases.filter((release) => release.group === "desktop");
  const shouldPublishNpm = npmReleases.length > 0;
  const shouldPublishDesktop = desktopReleases.length > 0;
  const releaseKind = shouldPublishDesktop ? (shouldPublishNpm ? "combined" : "desktop-only") : shouldPublishNpm ? "npm-only" : "none";
  const isPrerelease = releases.some((release) => typeof release.newVersion === "string" && release.newVersion.includes("-"));
  const releaseTag = buildReleaseTag(releases);
  const releaseName = releaseKind === "none" ? "No release" : `vcser ${releaseTag}`;
  const notes = previewNotes ?? buildNotes(releases);

  return {
    generatedAt: new Date().toISOString(),
    mode,
    releaseKind,
    releaseTag,
    releaseName,
    packageNames,
    shouldPublishNpm,
    shouldPublishDesktop,
    isPrerelease: Boolean(prerelease) || isPrerelease,
    pendingChangesets,
    pendingChangesWithoutChangesets,
    prerelease: prerelease ?? null,
    releases: releases.map((release) => ({
      name: release.name,
      group: release.group,
      oldVersion: release.oldVersion,
      newVersion: release.newVersion
    })),
    notes
  };
}

function buildReleaseTag(releases) {
  if (releases.length === 0) {
    return "vcser-no-release";
  }

  const versions = [...new Set(releases.map((release) => release.newVersion).filter(Boolean))];

  if (versions.length === 1) {
    return `vcser-v${versions[0]}`;
  }

  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const shortSha = runGit(["rev-parse", "--short", "HEAD"], { allowFailure: true })?.trim();
  return `vcser-release-${date}${shortSha ? `-${shortSha}` : ""}`;
}

function buildNotes(releases) {
  if (releases.length === 0) {
    return "No release packages were detected.";
  }

  const lines = [];
  const groups = [
    ["npm packages", releases.filter((release) => release.group === "npm")],
    ["desktop", releases.filter((release) => release.group === "desktop")]
  ];

  for (const [title, groupReleases] of groups) {
    if (groupReleases.length === 0) {
      continue;
    }

    lines.push(`## ${title}`, "");

    for (const release of groupReleases) {
      lines.push(`### ${release.name}`);
      lines.push(`- Version: ${release.newVersion}`);

      if (release.changelog) {
        lines.push("", release.changelog.trim());
      } else {
        lines.push("- Changelog entry was not found in the package changelog.");
      }

      lines.push("");
    }
  }

  return lines.join("\n").trimEnd();
}

function readChangelogSection(packageJsonPath, version) {
  const changelogPath = join(dirname(packageJsonPath), "CHANGELOG.md");
  const absoluteChangelogPath = join(workspaceRoot, changelogPath);

  if (!existsSync(absoluteChangelogPath)) {
    return null;
  }

  const changelog = readFileSync(absoluteChangelogPath, "utf8");
  const escapedVersion = escapeRegExp(version);
  const headingPattern = new RegExp(`^##\\s+.*${escapedVersion}.*$`, "m");
  const headingMatch = headingPattern.exec(changelog);

  if (!headingMatch) {
    return null;
  }

  const start = headingMatch.index + headingMatch[0].length;
  const rest = changelog.slice(start);
  const nextHeadingMatch = /^##\s+/m.exec(rest);
  const section = nextHeadingMatch ? rest.slice(0, nextHeadingMatch.index) : rest;

  return section.trim() || null;
}

function readPackageAtRef(ref, packagePath) {
  const output = runGit(["show", `${ref}:${packagePath}`], { allowFailure: true });

  if (!output) {
    return null;
  }

  return JSON.parse(output);
}

function runGit(gitArgs, { allowFailure = false } = {}) {
  const command = spawnSync("git", gitArgs, {
    cwd: workspaceRoot,
    encoding: "utf8"
  });

  if (command.status !== 0) {
    if (allowFailure) {
      return null;
    }

    process.stderr.write(command.stderr);
    process.exit(command.status ?? 1);
  }

  return command.stdout;
}

function writeGithubOutputs(outputPath, releaseMetadata) {
  const outputs = {
    release_kind: releaseMetadata.releaseKind,
    release_tag: releaseMetadata.releaseTag,
    release_name: releaseMetadata.releaseName,
    package_names: releaseMetadata.packageNames.join(","),
    should_publish_npm: String(releaseMetadata.shouldPublishNpm),
    should_publish_desktop: String(releaseMetadata.shouldPublishDesktop),
    is_prerelease: String(releaseMetadata.isPrerelease),
    pending_changesets: String(releaseMetadata.pendingChangesets),
    pending_changes_without_changesets: String(releaseMetadata.pendingChangesWithoutChangesets)
  };

  const lines = [];

  for (const [key, value] of Object.entries(outputs)) {
    lines.push(`${key}=${value}`);
  }

  writeFileSync(outputPath, `${lines.join("\n")}\n`, { flag: "a" });
}

function writeTextFile(filePath, contents) {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, contents);
}

function parseArgs(inputArgs) {
  const parsed = {};

  for (let index = 0; index < inputArgs.length; index += 1) {
    const arg = inputArgs[index];

    if (!arg.startsWith("--")) {
      continue;
    }

    const key = arg.slice(2).replaceAll("-", "_");
    const value = inputArgs[index + 1];

    if (!value || value.startsWith("--")) {
      parsed[toCamelCase(key)] = "true";
      continue;
    }

    parsed[toCamelCase(key)] = value;
    index += 1;
  }

  return parsed;
}

function toCamelCase(value) {
  return value.replaceAll(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function escapeRegExp(value) {
  return value.replaceAll(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
