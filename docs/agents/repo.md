# Repo Agent Guide

Use this file for repository-wide commands, environment requirements, dependency policy, generated files, and build/lint/format conventions.

## Environment

- Package manager: `pnpm`
- Required Node version: `>=22.13` from `package.json`
- Workspace layout: `apps/*` + `packages/*`
- Do not trust older prose docs over `package.json`, source, and build config

## Canonical Commands

- install dependencies: `pnpm install`
- start desktop app: `pnpm dev`
- build desktop app: `pnpm build`
- preview desktop app: `pnpm preview`
- start site locally: `pnpm site:dev`
- serve site on `127.0.0.1`: `pnpm site:serve`
- build site: `pnpm site:build`
- preview site: `pnpm site:preview`
- build CLI: `pnpm cli:build`
- start CLI dev flow: `pnpm cli:dev`
- smoke test CLI: `pnpm cli:smoke`
- typecheck CLI: `pnpm cli:typecheck`
- migrate legacy Prisma custom editors into the shared JSON store: `pnpm cli:start -- migrate custom-editors`
- generate Prisma client: `pnpm db:generate`
- run Prisma migration: `pnpm db:migrate`
- lint: `pnpm lint`
- lint with fixes: `pnpm lint:fix`
- format check: `pnpm format:check`
- format write: `pnpm format`
- preview release metadata: `pnpm release:plan`
- apply version and changelog updates: `pnpm release:version`
- enter repository-wide prerelease mode after previewing the current plan: `pnpm release:prerelease:enter`
- exit desktop beta prerelease mode: `pnpm release:prerelease:exit`
- preview the CLI publish tarball: `pnpm release:pack:cli`

## Workspace Commands

- desktop dev directly: `pnpm --filter @vcser/desktop dev`
- desktop build directly: `pnpm --filter @vcser/desktop build`
- site dev directly: `pnpm --filter @vcser/site dev`
- site build directly: `pnpm --filter @vcser/site build`
- CLI dev directly: `pnpm --filter @vcser/cli dev`
- CLI build directly: `pnpm --filter @vcser/cli build`
- CLI typecheck directly: `pnpm --filter @vcser/cli typecheck`
- core Prisma generate directly: `pnpm --filter @vcser/core db:generate`
- core Prisma migrate directly: `pnpm --filter @vcser/core db:migrate`
- core typecheck directly: `pnpm --filter @vcser/core typecheck`
- desktop TypeScript build directly: `pnpm --filter @vcser/desktop exec tsc -b`

## Install and Build Notes

- Workspace package `postinstall` hooks run Prisma generation for `packages/core` and the Electron binary check for `apps/desktop`.
- The CLI no longer rebuilds or initializes Prisma/native SQLite modules during normal startup; custom editor data lives in `~/.vcser/custom-editors.json`, and the legacy Prisma `CustomEditor` table is only touched by the explicit migration command.
- If install or runtime setup seems wrong, inspect `package.json` scripts before adding workaround instructions to docs.
- Prefer existing project scripts over ad hoc local commands.
- Do not edit `pnpm-lock.yaml` manually.

## Generated and Managed Files

- Never manually edit `packages/core/src/generated/prisma/`.
- Never manually edit `pnpm-lock.yaml`.
- Do not change the Prisma client output path in `packages/core/prisma/schema.prisma`.
- Treat `apps/desktop/electron.vite.config.ts` as a central build contract; avoid restructuring it without a clear requirement.
- Be careful with files under ignored plan/review directories if a task involves documentation artifacts.

## Dependency Policy

- Do not add new dependencies unless the task clearly requires them.
- Do not add a new UI framework or styling system.
- Do not install or upgrade to a dependency version published within the last 7 days.
- Reuse existing packages such as `type-fest`, `react-use`, `lucide-react`, and current Radix dependencies before adding alternatives.
- If a package version choice is needed, prefer one compatible with the current repo configuration.

## TypeScript and Shared Contracts

- Use strict TypeScript style.
- Avoid `any` unless truly unavoidable.
- Do not use TypeScript `enum`; use the const-object plus `ValueOf` pattern instead.
- Reuse exports from `packages/core/src/shared/` and the desktop renderer type layer before creating new ones.
- Put renderer-to-main communication behind the renderer IPC abstraction.

## Changeset Rules

- After any code change, decide whether a `changeset` is required before finishing the task.
- Default to considering a `changeset` for user-visible features, defect fixes, behavioral changes, package surface changes, release-note-worthy refactors, and desktop or CLI changes that should appear in release metadata.
- A `changeset` is often unnecessary for purely internal refactors, tests, local-only tooling, CI-only adjustments, or documentation-only edits that do not change shipped behavior.
- If the correct package, release scope, or bump level is unclear, ask the user instead of guessing silently.
- When uncertain, prefer the more conservative path: pause and clarify rather than skipping release metadata.
- Use `pnpm changeset` to create the file and `pnpm release:plan` to sanity-check the pending release shape.
- Follow `docs/release.md` for release policy, package participation, prerelease flow, and package-local changelog expectations.

## Documentation Rules

- Keep root `AGENTS.md` short and routing-focused.
- Put deeper agent guidance under `docs/agents/`.
- If docs conflict with source/config, trust the source/config.
- Update agent docs when project structure, shared contracts, or build/runtime assumptions materially change.
- Use `docs/release.md` as the authoritative phase-1 release operations guide.

## Practical Workflow

For repository-level tasks:

1. Check root `package.json` scripts and `apps/desktop/electron.vite.config.ts` first.
2. Confirm which workspace package or packages the task actually touches before editing shared docs or config.
3. Update the smallest authoritative doc or config that matches the change.
4. Avoid copying stale instructions from `README.md` or older notes into agent docs.
5. If the task is mainly UI, desktop runtime, or reusable core logic, also read `docs/agents/ui.md`, `docs/agents/runtime.md`, or `docs/agents/core.md`.

## Avoid

- manual lockfile edits
- manual generated-client edits
- dependency churn without clear need
- repo-wide structural changes that are larger than the task requires
- skipping the explicit `changeset` decision after code changes
- duplicating commands or requirements in multiple docs unless they truly need to be repeated
