# AGENTS.md

This file is for AI coding agents working in `vcser`. Prefer the current source tree and build config over potentially stale prose docs.

## Project Overview

`vcser` is a `pnpm workspace` monorepo. It currently includes desktop, site, CLI, and reusable core packages.

## Project Snapshot

- Package manager: `pnpm`
- Workspace packages: `apps/desktop`, `apps/site`, `packages/cli`, and `packages/core`
- Desktop runtime and build: `Electron` v33 + `electron-vite` v5
- Renderer: `React 18` + `TypeScript` + `Tailwind CSS v4` + `Zustand` v5
- Core persistence: `Prisma 7` + `SQLite` via `@prisma/adapter-better-sqlite3`
- UI reference: `DESIGN.md`

## Important Structure

```text
apps/desktop/            Desktop app package
	src/main/              Electron main process and IPC handlers
	src/preload/           Context bridge
	src/renderer/src/      React renderer
	src/assets/            Renderer assets
	resources/             Desktop packaging resources and icons
apps/site/               Marketing/documentation site package
packages/cli/            CLI package
packages/core/           Reusable runtime/core package
	src/editors/           Editor detection, diff, and sync logic
	src/shared/            Shared contracts and runtime message keys
	src/generated/prisma/  Generated Prisma client; never edit manually
	prisma/schema.prisma   Prisma schema; output must stay ../src/generated/prisma
docs/agents/             Deeper task-specific guidance for agents
DESIGN.md                Authoritative UI design reference
```

## Read This First By Task

- UI, renderer, styling, components, and theme work: `docs/agents/ui.md`
- Reusable editor/runtime logic, shared contracts, and Prisma: `docs/agents/core.md`
- Electron main, preload, desktop IPC, and desktop/runtime integration: `docs/agents/runtime.md`
- Commands, environment, linting, formatting, dependency policy, and generated files: `docs/agents/repo.md`
- Site or CLI work without a dedicated agent guide yet: inspect the target package source and `package.json` first, then use `docs/agents/repo.md` for repo-wide rules
- Prisma/native module ABI behavior across CLI and desktop: `docs/agents/core.md` and `docs/agents/runtime.md`

## Universal Rules

- Use English only in code, comments, labels, and identifiers.
- Keep changes minimal and local to the task.
- Do not add or remove comments unless explicitly asked.
- Prefer existing abstractions over introducing new patterns.
- Keep cross-platform behavior extensible for macOS and Windows.
- If docs conflict with source or config, trust the source or config.

## Guardrails

- Never manually edit `packages/core/src/generated/prisma/`.
- Never manually edit `pnpm-lock.yaml`.
- Do not add new dependencies unless the task clearly requires them.
- Do not install or upgrade to a dependency version published within the last 7 days.

## Completion Checklist

- Before ending a task, run the narrowest relevant validation aligned with `package.json` guardrails such as `eslint`, `tsc`, or the staged-file checks implied by `lint-staged`; do not assume commit hooks will catch avoidable issues later.
- After any code change, explicitly decide whether a `changeset` is required.
- If the affected package, release scope, or version bump level is unclear, ask the user before finishing and prefer the more conservative path over silently skipping the `changeset`.
- Use `docs/agents/repo.md` and `docs/release.md` when making or explaining `changeset` decisions.
- Keep this root file short; put deeper task-specific guidance in `docs/agents/`.
