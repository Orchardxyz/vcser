# Release Guide

This document defines the phase-1 release foundation for `vcser`.

## Scope

Phase 1 covers local release governance only:

- `@vcser/core`, `@vcser/cli`, and `@vcser/desktop` are all tracked by `changesets`
- `@vcser/cli` is prepared as a publishable npm package
- `@vcser/core` remains versioned but `private` until its runtime publish surface is formalized
- `@vcser/desktop` stays `private` and uses release metadata only
- changelog history is package-local, not root-level
- GitHub Release content is previewed locally before any workflow automation exists
- prerelease mode is available for any release plan, although `desktop` is the first expected consumer

Phase 1 does not publish to npm or upload desktop assets.

## Package Policy

### `@vcser/core`

- participates in `changesets`
- remains `private: true` in phase 1
- can still receive version and changelog updates
- will need a dedicated runtime build surface before public npm release

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
- `pnpm release:version`
  Apply version bumps and update package changelogs.
- `pnpm release:prerelease:enter`
  Enter repository-wide prerelease mode with the `beta` tag after previewing the current release plan.
- `pnpm release:prerelease:exit`
  Exit prerelease mode before resuming normal stable versioning.
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
3. Apply versions with `pnpm release:version`.
4. Review the updated package versions and package-local changelogs.

If `@vcser/core` changes, `@vcser/cli` may also receive a patch bump because internal dependency updates are configured with `updateInternalDependencies: "patch"`.

## Prerelease Flow

Use this flow when preparing any beta cut on a dedicated prerelease branch. `desktop` is the first expected consumer, but `core` and `cli` may also use it for test releases.

1. Add one or more changesets for the packages that should participate in the prerelease.
2. Enter prerelease mode with `pnpm release:prerelease:enter`.
3. Preview the beta output with `pnpm release:plan`.
4. Apply versions with `pnpm release:version`.
5. Confirm the affected package versions follow the expected `*-beta.n` pattern.
6. Exit prerelease mode with `pnpm release:prerelease:exit` after the prerelease line is complete.

Important constraints:

- Changesets prerelease mode is repository-wide, not package-scoped.
- `pnpm release:prerelease:enter` prints the packages in the current pending release plan before entering prerelease mode.
- Only the packages included in the current release plan should be present on that prerelease branch.
- While prerelease mode is active, `pnpm release:version` will warn before writing prerelease versions. That warning is expected.

## Validation Expectations

Phase 1 should be validated locally with dry runs:

1. a CLI-only changeset should classify as `npm-only`
2. a desktop-only changeset should classify as `desktop-only`
3. a combined `core` plus `desktop` changeset should classify as `combined`
4. entering prerelease mode should surface the `beta` tag in `pnpm release:plan`
5. `pnpm release:version` should write changelog updates into package-local `CHANGELOG.md` files
6. `pnpm release:pack:cli` should show a tarball that contains only the CLI runtime artifact surface
