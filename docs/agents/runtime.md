# Runtime Agent Guide

Use this file for desktop Electron main-process work, preload changes, desktop IPC handlers, and integration with the reusable core package.

## Start Here

Read these areas first for most runtime tasks:

- `apps/desktop/src/main/`
- `apps/desktop/src/preload/`
- `packages/core/src/shared/`
- `packages/core/src/editors/`
- `apps/desktop/electron.vite.config.ts`
- `packages/core/prisma/schema.prisma`

## Runtime Boundaries

- Electron main-process code lives in `apps/desktop/src/main/`.
- The context bridge lives in `apps/desktop/src/preload/`.
- Shared IPC commands and shared contracts live in `packages/core/src/shared/`.
- Reusable editor/runtime logic lives in `packages/core/src/editors/`.
- The renderer should call into runtime logic through the renderer IPC abstraction.
- Keep Prisma usage in `packages/core` and desktop main-process integration code, never in the renderer.

## IPC Model

- Supported command names and shared payload/result contracts are defined in `packages/core/src/shared/`.
- The preload layer exposes `window.electronAPI.invoke()` via `contextBridge`.
- The renderer IPC layer first attempts the real Electron bridge and falls back to demo responses on failure.
- Do not remove the demo fallback unless the task explicitly requires that behavior change.

## Runtime i18n Contract

- Shared locale and runtime message-key contracts live in `packages/core/src/shared/i18n.ts`.
- For user-visible runtime failures, prefer stable `errorKey` and optional `errorParams` on shared result types over baking localized strings into main-process code.
- Keep message keys stable and semantic, for example invalid payloads, unavailable editors, unsupported actions, and missing sync results.
- Preserve raw `error` strings only as a fallback for unexpected failures that do not yet map cleanly to a shared runtime key.
- When changing a runtime result contract, update main-process handlers, shared types, renderer consumers, and demo fallback responses together.

## Electron Security Rules

- Preserve `contextIsolation: true`.
- Preserve `nodeIntegration: false`.
- Do not bypass the preload bridge by exposing unnecessary renderer globals.
- Do not weaken BrowserWindow security defaults without a clear task requirement.

## Prisma and Database Rules

- The Prisma schema output path must remain `../src/generated/prisma` in `packages/core/prisma/schema.prisma`.
- Never manually edit `packages/core/src/generated/prisma/`.
- The core database layer bridges ESM runtime code to the generated CommonJS Prisma client via `createRequire()`.
- Be careful when changing Prisma initialization; the current code intentionally tolerates Prisma unavailability and falls back when cache access is unavailable.
- Keep database/cache concerns in `packages/core` and call them from desktop main-process code.
- The SQLite database file is shared with the CLI. Do not introduce a desktop-only database path or desktop-only storage fork to solve native module problems.
- Electron must use an Electron-ABI rebuild of `better-sqlite3`. The desktop entrypoints rely on `apps/desktop/scripts/rebuild-native-modules.cjs`, and `@vcser/desktop` runs it from `predev` and `postinstall`.
- If desktop works but the CLI starts failing, or vice versa, the likely cause is that one runtime rebuilt `better-sqlite3` for its own ABI. Fix the rebuild path rather than changing Prisma schema, changing the database location, or adding a new fallback store.

## Editor Logic

The editor/runtime implementation currently centers around `packages/core/src/editors/`:

- discovery logic handles editor detection across supported platforms.
- extension logic handles inspection, mutation, and sync execution.
- settings logic handles settings reading and diffing.
- namespace/registry logic maps extensions, settings namespaces, and editor metadata.

When changing sync behavior, inspect the full path from IPC handler to editor helper before editing a single function.

## Main Process Entry Points

- The main process entry layer creates the `BrowserWindow` and registers IPC handlers.
- Machine identity, editor detection, extension diffing, settings diffing, and sync execution all flow through handlers there or through helper registration.
- If you change shared commands or payloads, update both the main process handler and the shared contract.
- Check likely renderer consumers before changing a central runtime contract.

## Practical Workflow

For a typical runtime task:

1. Confirm whether the change belongs in `packages/core/src/shared/`, `packages/core/src/editors/`, `apps/desktop/src/preload/`, or `apps/desktop/src/main/`.
2. Trace the command and payload through the shared contract layer, preload, desktop IPC handlers, and core editor helpers.
3. Update shared contracts in core before or alongside call-site behavior.
4. Preserve renderer compatibility, including demo fallback behavior, unless the task explicitly changes that contract.
5. If a runtime change affects UI assumptions, also read `docs/agents/ui.md`.

## Avoid

- putting runtime-only logic in the renderer
- editing generated Prisma client files
- changing IPC command names without updating all consumers
- weakening security defaults
- treating the renderer IPC layer as a pure stub; it is a real bridge with a demo fallback
