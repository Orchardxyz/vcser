# AGENTS.md

This file is for AI coding agents working in `vcser`. Prefer the current source tree and build config over potentially stale prose docs.

## Project Overview

`vcser` is a desktop Electron app for syncing extensions and settings across VS Code-based editors on the same machine.

## Project Snapshot

- Package manager: `pnpm`
- Runtime and build: `Electron` v33 + `electron-vite` v5
- Renderer: `React 18` + `TypeScript` + `Tailwind CSS v4` + `Zustand` v5
- Shared contracts: `src/shared/`
- Main-process persistence: `Prisma 7` + `SQLite` via `@prisma/adapter-better-sqlite3`
- UI reference: `DESIGN.md`

## Important Structure

```text
src/main/                Electron main process and editor/runtime logic
src/preload/             Context bridge
src/shared/              IPC commands and shared types
src/renderer/src/        React renderer
src/generated/prisma/    Generated Prisma client; never edit manually
prisma/schema.prisma     Prisma schema; output must stay ../src/generated/prisma
docs/agents/             Deeper task-specific guidance for agents
DESIGN.md                Authoritative UI design reference
```

## Read This First By Task

- UI, renderer, styling, components, and theme work: `docs/agents/ui.md`
- Electron main, preload, shared IPC, Prisma, and editor sync logic: `docs/agents/runtime.md`
- Commands, environment, linting, formatting, dependency policy, and generated files: `docs/agents/repo.md`

## Universal Rules

- Use English only in code, comments, labels, and identifiers.
- Keep changes minimal and local to the task.
- Do not add or remove comments unless explicitly asked.
- Prefer existing abstractions over introducing new patterns.
- Keep cross-platform behavior extensible for macOS and Windows.
- Use strict TypeScript style.
- Do not introduce `any` unless explicitly unavoidable.
- Reuse shared contracts from `src/shared/` and the renderer type layer before creating new ones.
- Do not use TypeScript `enum`; use the const-object plus `ValueOf` pattern instead.
- Renderer-to-main calls should go through the renderer IPC abstraction.
- Keep Prisma usage in the Electron main process, not the renderer.
- If docs conflict with source or config, trust the source or config.

## Guardrails

- Never manually edit `src/generated/prisma/`.
- Never manually edit `pnpm-lock.yaml`.
- Do not change the Prisma client output path in `prisma/schema.prisma`; it must remain `../src/generated/prisma`.
- Do not restructure `electron.vite.config.ts` without a clear task requirement.
- Do not remove the demo fallback in the renderer IPC layer unless the task explicitly requires it.
- Do not add new UI frameworks or styling systems.
- Do not add new dependencies unless the task clearly requires them.
- Do not install or upgrade to a dependency version published within the last 7 days.
- Do not weaken Electron security defaults such as `contextIsolation: true` and `nodeIntegration: false`.

## Practical Defaults For Agents

- For UI work, inspect `src/renderer/src/`, `src/renderer/src/components/`, and `src/renderer/src/pages/` first.
- For shared contracts, inspect `src/shared/` and the renderer type layer first.
- For desktop and runtime work, inspect `src/main/`, `src/preload/`, and `src/main/editors/` first.
- For styling decisions, treat `DESIGN.md` and `src/renderer/src/styles.css` as the source of truth.
- Keep this root file short; put deeper task-specific guidance in `docs/agents/`.
