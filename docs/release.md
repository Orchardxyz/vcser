# Release Guide

This document defines the phase-1 release foundation for `vcser`.

## Scope

Phase 1 covers local release governance:

- `@vcser/core`, `@vcser/cli`, and `@vcser/desktop` are all tracked by `changesets`
- `@vcser/cli` is prepared as a publishable npm package
- `@vcser/core` remains versioned but `private` until its runtime publish surface is formalized
- `@vcser/desktop` stays `private` and uses release metadata only
- changelog history is package-local, not root-level
- GitHub Release content is previewed locally before any workflow automation exists
- prerelease mode is available for any release plan, although `desktop` is the first expected consumer

Phase 2 adds branch-safe release automation:

- `.github/workflows/version-packages.yml` creates or updates a `Version Packages` PR after changesets land on `main`
- `.github/workflows/release.yml` resolves release metadata for pending plans and committed release bumps
- npm publish runs through GitHub Actions OIDC provenance instead of a long-lived npm token
- desktop builds are packaged on macOS, Windows, and Linux and uploaded as GitHub Release assets
- one GitHub Release is created for npm-only, desktop-only, and combined releases
- branch rehearsals run as dry-runs and cannot publish

## Package Policy

### `@vcser/core`

- participates in `changesets`
- publishes from `dist`
- includes generated Prisma runtime assets and Prisma migrations needed by the runtime database bootstrap
- uses `publishConfig.access: "public"`

### `@vcser/cli`

- participates in `changesets`
- intended for stable npm release
- uses `publishConfig.access: "public"`
- may also be published as a prerelease when a testing branch needs it

### `@vcser/desktop`

- participates in `changesets`
- remains `private: true` during the beta stage
- does not publish to npm
- is expected to use prerelease versioning first during the beta stage

## Changelog Policy

Do not maintain a root `CHANGELOG.md`.

Release history is generated per package:

- `packages/core/CHANGELOG.md`
- `packages/cli/CHANGELOG.md`
- `apps/desktop/CHANGELOG.md`

These files are created or updated by `pnpm release:version`.

## Commands

- `pnpm changeset`
  Create a new changeset.
- `pnpm release:status`
  Show the current `changesets` release plan directly.
- `pnpm release:plan`
  Output normalized release metadata plus a GitHub Release notes skeleton. If the workspace has unreleased package changes but no changeset files yet, it returns a non-fatal `pendingChangesWithoutChangesets` signal.
- `pnpm release:resolve`
  Resolve release metadata for automation. By default it compares committed package versions between `HEAD^` and `HEAD`. Use `pnpm release:resolve --mode pending` to rehearse a pending changesets plan on a branch.
- `pnpm release:version`
  Apply version bumps and update package changelogs.
- `pnpm release:prerelease:enter`
  Enter repository-wide prerelease mode with the `beta` tag after previewing the current release plan.
- `pnpm release:prerelease:exit`
  Exit prerelease mode before resuming normal stable versioning.
- `pnpm release:pack:core`
  Preview the publish tarball for `@vcser/core`.
- `pnpm release:pack:cli`
  Preview the publish tarball for `@vcser/cli`.

## Release Classification

`pnpm release:plan` classifies each pending release as one of:

- `npm-only`
  Only npm packages are included.
- `desktop-only`
  Only `@vcser/desktop` is included.
- `combined`
  At least one npm package and `@vcser/desktop` are both included.

The command also emits:

- bumped package names
- old and new versions
- prerelease state, if active
- whether package changes exist without matching changeset files yet
- a release notes skeleton grouped into `npm packages` and `desktop`

If an npm package is bumped only because an internal workspace dependency changed, the notes mark it as `Internal dependency version update only.`

## Stable Release Flow

Use this flow for normal stable `core` and `cli` releases while the repository is not in prerelease mode.

1. Add one or more changesets with `pnpm changeset`.
2. Preview the release metadata with `pnpm release:plan`.
3. Merge the feature PR to `main` after normal CI passes.
4. Wait for the `Version Packages` workflow to create or update the `Version Packages` PR.
5. Review the generated package versions and package-local changelogs in that PR.
6. Merge the `Version Packages` PR when a maintainer decides to publish.
7. The `Release` workflow publishes only after that `Version Packages` merge.

If `@vcser/core` changes, `@vcser/cli` may also receive a patch bump because internal dependency updates are configured with `updateInternalDependencies: "patch"`.

## Prerelease Flow

Use this flow when preparing any beta cut on a dedicated prerelease branch. `desktop` is the first expected consumer, but `core` and `cli` may also use it for test releases.

1. Add one or more changesets for the packages that should participate in the prerelease.
2. Enter prerelease mode with `pnpm release:prerelease:enter`.
3. Preview the beta output with `pnpm release:plan`.
4. Merge the prerelease setup branch to `main` after normal CI passes.
5. Review the generated `Version Packages` PR and confirm the affected package versions follow the expected `*-beta.n` pattern.
6. Merge the `Version Packages` PR when a maintainer decides to publish the beta.
7. Exit prerelease mode with `pnpm release:prerelease:exit` in a follow-up PR after the prerelease line is complete.

Important constraints:

- Changesets prerelease mode is repository-wide, not package-scoped.
- `pnpm release:prerelease:enter` prints the packages in the current pending release plan before entering prerelease mode.
- Only the packages included in the current release plan should be present on that prerelease branch.
- While prerelease mode is active, `pnpm release:version` will warn before writing prerelease versions. That warning is expected.

## Automated Release Workflow

The automated release process has two workflows:

- `Version Packages`
  Runs on pushes to `main` that are not already `Version Packages` merges. It uses `changesets/action` to create or update a `Version Packages` PR with version bumps and package-local changelogs.
- `Release`
  Runs on pushes to `main` and manual dispatch. Manual dispatch is dry-run only. Real publish jobs run only when the pushed commit is the `Version Packages` merge commit.

The `Release` workflow has four jobs:

- `resolve-release`
  Produces `release_kind`, `should_publish_npm`, `should_publish_desktop`, `is_prerelease`, a release tag, metadata JSON, and a release notes markdown file.
- `publish-npm`
  Runs only for real releases on `main` when `@vcser/core` or `@vcser/cli` changed. It uses Node 24, upgrades npm to the latest CLI, verifies the npm Trusted Publishing baseline, installs dependencies, runs core and CLI typecheck plus build validation, then publishes with `changeset publish`, `id-token: write`, and `NPM_CONFIG_PROVENANCE=true`.
- `publish-desktop`
  Runs whenever `@vcser/desktop` changed, including branch dry-runs. It packages macOS, Windows, and Linux artifacts and uploads them as workflow artifacts. Signing and notarization are intentionally left as future slots.
- `create-github-release`
  Runs only for real releases on `main` after publish/build jobs succeed. It creates one GitHub Release, marks prerelease versions as prereleases, and attaches desktop assets when present.

Manual workflow runs are dry-runs only. Branch runs can resolve metadata, build desktop packages, and generate notes, but they cannot publish npm packages or create GitHub Releases.

The workflow skips commits whose message starts with `Version Packages`, which prevents release PR merge commits from immediately opening a new release PR. Do not use a broader substring match here because ordinary maintenance commits may mention the workflow by name.

### Required Repository Secrets

- `VERSION_PACKAGES_TOKEN`
  Used by the `Version Packages` workflow when `changesets/action` creates or updates the release PR. Configure this as a GitHub App installation token or a bot personal access token with repository write access for contents, pull requests, and issues.

The workflow disables persisted `actions/checkout` credentials so the release branch push uses `VERSION_PACKAGES_TOKEN`, not the default `GITHUB_TOKEN`. This matters because pushes made with the default workflow token do not trigger follow-up `pull_request` CI, leaving required checks pending on the generated release PR.

## Validation Expectations

Release planning should be validated locally with dry runs:

1. a CLI-only changeset should classify as `npm-only`
2. a desktop-only changeset should classify as `desktop-only`
3. a combined `core` plus `desktop` changeset should classify as `combined`
4. entering prerelease mode should surface the `beta` tag in `pnpm release:plan`
5. `pnpm release:version` should write changelog updates into package-local `CHANGELOG.md` files
6. `pnpm release:pack:core` should show a tarball with core `dist`, generated Prisma runtime assets, and migrations
7. `pnpm release:pack:cli` should show a tarball that contains only the CLI runtime artifact surface
8. `pnpm release:resolve --mode pending` should generate branch-safe metadata before versioning
9. `pnpm release:resolve` should detect committed package version bumps after versioning
10. `pnpm --filter @vcser/core build` should emit runnable JS, declaration files, generated Prisma runtime assets, and packaged migrations
