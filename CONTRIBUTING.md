# Contributing to vcser

Thanks for taking the time to contribute.

`vcser` is a `pnpm` workspace monorepo. The main packages are:

- `apps/desktop`: Electron desktop app
- `packages/core`: shared runtime logic, Prisma, and SQLite integration
- `packages/cli`: CLI entrypoint built on top of `@vcser/core`

## Requirements

- Node.js `>=22.13`
- `pnpm`

Install dependencies from the repository root:

```bash
pnpm install
```

## Common Commands

Run these commands from the repository root unless noted otherwise.

```bash
pnpm dev
pnpm lint
pnpm test
pnpm format:check
pnpm --filter @vcser/core typecheck
pnpm --filter @vcser/cli typecheck
pnpm --filter @vcser/desktop exec tsc -b
```

Useful package-specific commands:

```bash
pnpm --filter @vcser/desktop dev
pnpm --filter @vcser/core db:generate
pnpm --filter @vcser/core db:migrate
pnpm --filter @vcser/cli smoke
```

## Where To Make Changes

- Renderer UI, pages, and styles: `apps/desktop/src/renderer/src/`
- Electron main process: `apps/desktop/src/main/`
- Electron preload bridge: `apps/desktop/src/preload/`
- Shared runtime logic and contracts: `packages/core/src/`
- Prisma schema: `packages/core/prisma/schema.prisma`
- CLI behavior: `packages/cli/src/`

If docs conflict with source or package scripts, follow the source and scripts.

## Project Rules

- Keep changes focused and local to the task.
- Use English only in code, comments, labels, and identifiers.
- Reuse existing abstractions before adding new patterns.
- Keep TypeScript strict. Do not introduce `any` unless it is truly unavoidable.
- Do not use TypeScript `enum`. Use the existing const-object pattern instead.
- Keep renderer-to-main calls behind the renderer IPC abstraction.
- Keep Prisma usage in `packages/core` and desktop main-process code, not the renderer.
- Do not add dependencies unless the change clearly requires them.

## Files You Must Not Edit Manually

- `packages/core/src/generated/prisma/`
- `pnpm-lock.yaml`

Also do not change the Prisma client output path in `packages/core/prisma/schema.prisma`.

## Pull Requests

- Create a branch and open a pull request into `main`.
- Keep pull requests small enough to review comfortably.
- Explain the user-facing or maintenance reason for the change.
- List the commands you used to validate the change.
- Include screenshots when the renderer UI changes.
- Call out breaking changes clearly, even if they are intentional.

Before opening a pull request, run the narrowest relevant validation for your change. In most cases that means:

```bash
pnpm lint
pnpm test
```

Add package-specific typechecks when your change touches desktop, core, or CLI code.
