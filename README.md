# vcser

`vcser` is a desktop app (Electron + React) that syncs **extensions** and **settings** across VS Code-based editors on the same machine.

## Stack

- Package manager: **pnpm**
- Desktop runtime: **Electron**
- Build tool: **electron-vite v5**
- Frontend: **React + UnoCSS + Zustand**
- Backend scaffold: **Electron main process + Prisma + SQLite**

## Scope

- Desktop-only app (no CLI compatibility layer)
- Local dev/build workflow only in this phase
- UI logic is still transitional; current IPC is stubbed to keep static pages renderable during the migration

## Supported Editors

Built-in detection includes:

- Demo editors rendered from the current IPC stub layer during this phase

The future production Electron IPC layer will replace the current stub implementation.

## Features

- 3-step desktop flow (Select → Diff → Sync)
- UnoCSS styling preserved during the platform migration
- Zustand store scaffold for future renderer state refactors
- Prisma + SQLite scaffold in the Electron main process
- IPC stub layer that keeps the static workflow renderable without backend integration

## Requirements

- Node.js `>=20.19` or `>=22.12`
- pnpm
- Editor CLI commands available on `PATH` for extension install/uninstall operations

## Setup

```bash
pnpm install
```

## Development

Run full desktop app:

```bash
pnpm dev
```

## Build

```bash
pnpm build
```

## Prisma

```bash
pnpm db:generate
pnpm db:migrate
```

## Desktop Flow

1. **Step 1 — Select Editors**
   - Choose at least 2 editors from the stubbed list
   - Optionally add custom editor values in the existing modal
2. **Step 2 — Review Diffs**
   - Inspect the static extension matrix
   - Choose settings mode (`safe` or `exact`)
3. **Step 3 — Execute Sync**
   - Review static actions/results scaffolding before the real backend lands
