# Core Agent Guide

Use this file for reusable editor/runtime logic, shared contracts, and Prisma-backed cache logic in `packages/core`.

## Start Here

Read these areas first for most core tasks:

- `packages/core/src/editors/`
- `packages/core/src/shared/`
- `packages/core/src/db.ts`
- `packages/core/src/typeGuards.ts`
- `packages/core/prisma/schema.prisma`

## Core Boundaries

- Reusable editor/runtime logic lives in `packages/core/src/editors/`.
- Shared contracts and runtime message keys live in `packages/core/src/shared/`.
- Prisma initialization lives in `packages/core/src/db.ts`.
- The generated Prisma client lives in `packages/core/src/generated/prisma/`.
- `packages/core` must not depend on Electron, React, renderer state, or desktop-only UI code.

## Shared Contracts

- Keep domain contracts in `packages/core/src/shared/types.ts`.
- Keep runtime message keys and locale contracts in `packages/core/src/shared/i18n.ts`.
- Keep supported desktop IPC command names in `packages/core/src/shared/ipc.ts`.
- When changing a contract, update desktop main handlers, renderer consumers, and demo fallback responses together.

## Prisma Rules

- The Prisma schema output path must remain `../src/generated/prisma` in `packages/core/prisma/schema.prisma`.
- Never manually edit `packages/core/src/generated/prisma/`.
- Prefer the package scripts for Prisma work:
  - `pnpm --filter @vcser/core db:generate`
  - `pnpm --filter @vcser/core db:migrate`
- Be careful when changing `db.ts`; it intentionally tolerates Prisma unavailability and falls back when cache access is unavailable.

## Editor Logic

The editor implementation currently centers around `packages/core/src/editors/`:

- `detect.ts`, `detect.macos.ts`, `detect.windows.ts`: editor discovery
- `extensions.ts`: extension listing, metadata, and diffing
- `extensionManagement.ts`: enable/disable and uninstall behavior
- `extensionSync.ts`: install/sync behavior
- `settings.ts`: settings parsing, diffing, and namespace grouping
- `configNamespace.ts`: namespace resolution and Prisma-backed cache
- `registry.ts`, `utils.ts`, `extensionFs.ts`: supporting editor/runtime helpers

## Practical Workflow

For a typical core task:

1. Confirm whether the change belongs in shared contracts, editor logic, or Prisma/cache logic.
2. Trace which desktop IPC handlers or renderer consumers rely on the affected function or type.
3. Update shared contracts before or alongside behavior changes.
4. Keep desktop integration concerns out of core unless the task explicitly needs a new export surface.
5. Validate with the narrowest command available, for example `pnpm --filter @vcser/core typecheck` or `pnpm --filter @vcser/core db:generate`.

## Avoid

- importing Electron APIs into `packages/core`
- importing renderer code or renderer-only types into `packages/core`
- editing generated Prisma files manually
- hiding desktop-specific behavior in core exports when a desktop IPC layer is more appropriate
- reintroducing old root-local aliases such as `@shared/*`
