# AGENTS.md

This file is for AI coding agents working in `vcser`. Prefer the current source tree and build config over potentially stale prose docs.

## Project Overview

`vcser` is a `pnpm workspace` monorepo. It currently ships a desktop Electron app and a reusable runtime/core package for future non-desktop entrypoints.

## Project Snapshot

- Package manager: `pnpm`
- Workspace packages: `apps/desktop` and `packages/core`
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

## Universal Rules

- Use English only in code, comments, labels, and identifiers.
- Keep changes minimal and local to the task.
- Do not add or remove comments unless explicitly asked.
- Prefer existing abstractions over introducing new patterns.
- Keep cross-platform behavior extensible for macOS and Windows.
- Use strict TypeScript style.
- Do not introduce `any` unless explicitly unavoidable.
- Reuse exports from `packages/core/src/shared/` and the desktop renderer type layer before creating new ones.
- Do not use TypeScript `enum`; use the const-object plus `ValueOf` pattern instead.
- Renderer-to-main calls should go through the renderer IPC abstraction.
- Keep Prisma usage in `packages/core` and desktop main-process code, not the renderer.
- If docs conflict with source or config, trust the source or config.

## Guardrails

- Never manually edit `packages/core/src/generated/prisma/`.
- Never manually edit `pnpm-lock.yaml`.
- Do not change the Prisma client output path in `packages/core/prisma/schema.prisma`; it must remain `../src/generated/prisma`.
- Do not restructure `apps/desktop/electron.vite.config.ts` without a clear task requirement.
- Do not remove the demo fallback in the renderer IPC layer unless the task explicitly requires it.
- Do not add new UI frameworks or styling systems.
- Do not add new dependencies unless the task clearly requires them.
- Do not install or upgrade to a dependency version published within the last 7 days.
- Do not weaken Electron security defaults such as `contextIsolation: true` and `nodeIntegration: false`.
- Do not reintroduce direct desktop-to-core source coupling through old root aliases such as `@shared/*`.

## Practical Defaults For Agents

- For UI work, inspect `apps/desktop/src/renderer/src/`, `apps/desktop/src/renderer/src/components/`, and `apps/desktop/src/renderer/src/pages/` first.
- For shared contracts and reusable runtime logic, inspect `packages/core/src/shared/` and `packages/core/src/editors/` first.
- For desktop runtime work, inspect `apps/desktop/src/main/`, `apps/desktop/src/preload/`, and then the relevant `packages/core/src/` modules.
- For styling decisions, treat `DESIGN.md` and `apps/desktop/src/renderer/src/styles.css` as the source of truth.
- Keep this root file short; put deeper task-specific guidance in `docs/agents/`.
