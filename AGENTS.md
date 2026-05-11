# AGENTS.md

This file is for AI coding agents working in `vcser`. Prefer the current source tree and build config over potentially stale prose docs.

## Project Overview

`vcser` is a desktop app for syncing extensions and settings across VS Code-based editors on the same machine.

## Current Stack

- Package manager: `pnpm`
- Runtime: `Electron` v33
- Build tool: `electron-vite` v5
- Renderer: `React 18` + `TypeScript` + `Tailwind CSS v4`
- State: `Zustand` v5
- Persistence scaffold: `Prisma 7` + `SQLite` via `@prisma/adapter-better-sqlite3`
- Icons: `lucide-react`
- Utility hooks: `react-use`

## Important Structure

```text
src/main/                Electron main process
  index.ts               BrowserWindow bootstrap
  db.ts                  Prisma client singleton

src/preload/             Preload/context bridge layer

src/renderer/src/
  app.tsx                Root app; switches between Overview / Local Editors / Settings
  ipc.ts                 Stubbed invoke layer returning demo data
  types.ts               Shared TypeScript types and constant groups
  styles.css             Tailwind v4 entry and theme tokens
  store/                 Zustand scaffold
  pages/                 Top-level renderer pages
  components/            Shared UI components such as Sidebar and BaseModal

src/generated/prisma/    Generated Prisma client; never edit manually
prisma/schema.prisma     Prisma schema; generated output stays in ../src/generated/prisma
DESIGN.md                Authoritative UI design/styling reference
```

## Development Commands

- Install dependencies: `pnpm install`
- Start dev app: `pnpm dev`
- Build app: `pnpm build`
- Generate Prisma client: `pnpm db:generate`
- Run Prisma migration: `pnpm db:migrate`
- If Electron install scripts were skipped and the binary is missing: `node node_modules/electron/install.js`

## Coding Conventions

### General

- Use English only in code, comments, labels, and identifiers.
- Keep changes minimal and local to the task.
- Do not add or remove comments unless explicitly asked.
- Prefer existing abstractions over introducing new patterns.
- Develop features with cross-platform behavior in mind. `vcser` targets both macOS and Windows; even if a Windows-specific capability is not yet exposed, keep implementations extensible and flexible for future Windows support.

### TypeScript

- Use strict TypeScript style.
- Do not introduce `any` unless explicitly unavoidable.
- Reuse existing shared types from `src/renderer/src/types.ts` before creating new ones.
- Do not use TypeScript `enum`.
- Use the Const Enum Pattern instead:

```ts
import type { ValueOf } from "type-fest";

export const FOO = {
  A: "a",
  B: "b"
} as const;

export type Foo = ValueOf<typeof FOO>;
```

- For more complex TypeScript type gymnastics, use `type-fest` to handle them.

- Put new shared constant groups in `src/renderer/src/types.ts` unless they are truly component-local.

### Renderer UI

- Use Tailwind CSS v4 utility classes.
- Extend design tokens in `src/renderer/src/styles.css` via the `@theme` block; do not introduce separate Tailwind config files.
- Follow `DESIGN.md` for color, radius, shadow, spacing, and button-state decisions.
- Use `lucide-react` for icons; do not use emoji as UI icons.
- Reuse `BaseModal` for dialogs and overlays.
- Prefer `react-use` helpers already in the project for modal and event behavior.
- Buttons should support default, hover, active, focus-visible, and disabled states.

### Data Flow and Boundaries

- Renderer-to-main calls should go through the `invoke()` abstraction in `src/renderer/src/ipc.ts`.
- Treat `ipc.ts` as a stubbed compatibility layer unless the task explicitly includes real backend integration.
- Keep Prisma usage in the Electron main process, not the renderer.
- Preserve Electron security defaults: context isolation stays enabled, and `nodeIntegration` stays disabled.

## Agent Guardrails

- Never manually edit `src/generated/prisma/`.
- Never manually edit `pnpm-lock.yaml`.
- Do not change the Prisma client output path in `prisma/schema.prisma`; it must remain `../src/generated/prisma`.
- Do not replace or remove the demo/stub response contract in `src/renderer/src/ipc.ts` unless the task explicitly requires backend wiring.
- Do not restructure `electron.vite.config.ts` without a clear task requirement.
- Do not add new UI frameworks or styling systems.
- Do not add new dependencies unless the task clearly requires them.
- Do not weaken Electron security settings.

## Practical Defaults For Agents

- For UI work, inspect `Sidebar.tsx`, `BaseModal.tsx`, and the page components first.
- For shared renderer constants/types, inspect `types.ts` first.
- For desktop/runtime changes, inspect `src/main/index.ts` and `src/preload/` first.
- For styling decisions, treat `DESIGN.md` as the source of truth.
- If docs conflict with source/config, trust the source/config.
