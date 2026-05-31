import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { readdir, stat } from "node:fs/promises";
import { join, relative } from "node:path";
import { spawnSync } from "node:child_process";

const workspaceRoot = process.cwd();
const env = process.env;
const releaseNotesPath = env.RELEASE_NOTES_PATH ?? "release-metadata/release-notes.md";
const releaseAssetsDir = env.RELEASE_ASSETS_DIR ?? "release-assets";
const releaseTag = requireEnv("RELEASE_TAG");
const releaseName = requireEnv("RELEASE_NAME");
const shouldPublishNpm = parseBoolean(env.SHOULD_PUBLISH_NPM);
const shouldPublishDesktop = parseBoolean(env.SHOULD_PUBLISH_DESKTOP);
const isPrerelease = parseBoolean(env.IS_PRERELEASE);
const npmResult = env.NPM_RESULT ?? "skipped";
const desktopResult = env.DESKTOP_RESULT ?? "skipped";
const targetSha = env.GITHUB_SHA ?? "HEAD";
const dryRun = parseBoolean(env.RELEASE_DRY_RUN);

const desktopAssets = shouldPublishDesktop ? await listFiles(releaseAssetsDir) : [];

appendDesktopAssetList(desktopAssets);
verifyReleasableAssets(desktopAssets);
appendPartialReleaseStatus();
createGithubRelease(desktopAssets);

function requireEnv(name) {
  const value = env[name];

  if (!value) {
    console.error(`Missing required environment variable: ${name}`);
    process.exit(1);
  }

  return value;
}

function parseBoolean(value) {
  return value === "true";
}

async function listFiles(directory) {
  if (!existsSync(directory)) {
    return [];
  }

  const files = [];
  const entries = await readdir(directory);

  for (const entry of entries) {
    const filePath = join(directory, entry);
    const fileStats = await stat(filePath);

    if (fileStats.isDirectory()) {
      files.push(...(await listFiles(filePath)));
      continue;
    }

    if (fileStats.isFile()) {
      files.push(filePath);
    }
  }

  return files.sort((left, right) => left.localeCompare(right));
}

function appendDesktopAssetList(assets) {
  if (assets.length === 0) {
    return;
  }

  appendLines(releaseNotesPath, ["", "## release assets", "", ...assets.map((asset) => `- ${relative(releaseAssetsDir, asset) || asset}`)]);
}

function verifyReleasableAssets(assets) {
  const hasNpmRelease = shouldPublishNpm && npmResult === "success";
  const hasDesktopAssets = shouldPublishDesktop && assets.length > 0;

  if (!hasNpmRelease && !hasDesktopAssets) {
    console.error("No npm release or desktop assets are available for this release.");
    process.exit(1);
  }
}

function appendPartialReleaseStatus() {
  const notes = [];

  if (shouldPublishNpm && npmResult !== "success") {
    notes.push(`- npm publish result: ${npmResult}`);
  }

  if (shouldPublishDesktop && desktopResult !== "success") {
    notes.push(`- desktop publish result: ${desktopResult}`);
  }

  if (notes.length === 0) {
    return;
  }

  appendLines(releaseNotesPath, ["", "## partial release status", "", ...notes]);
}

function appendLines(filePath, lines) {
  appendFileSync(filePath, `${lines.join("\n")}\n`);
}

function createGithubRelease(assets) {
  const args = ["release", "create", releaseTag, "--title", releaseName, "--notes-file", releaseNotesPath, "--target", targetSha];

  if (isPrerelease) {
    args.push("--prerelease");
  }

  args.push(...assets);

  if (dryRun) {
    console.log(`gh ${args.map(quoteArg).join(" ")}`);
    console.log(readFileSync(releaseNotesPath, "utf8"));
    return;
  }

  const command = spawnSync("gh", args, {
    cwd: workspaceRoot,
    stdio: "inherit"
  });

  if (command.status !== 0) {
    process.exit(command.status ?? 1);
  }
}

function quoteArg(value) {
  return value.includes(" ") ? JSON.stringify(value) : value;
}
