# Repo Agent Guide

Use this file for repository-wide commands, environment requirements, dependency policy, generated files, and build/lint/format conventions.

## Environment

- Package manager: `pnpm`
- Required Node version: `>=22.13` from `package.json`
- Runtime/build stack: Electron + electron-vite
- Do not trust older prose docs over `package.json`, source, and build config

## Canonical Commands

- install dependencies: `pnpm install`
- start dev app: `pnpm dev`
- build app: `pnpm build`
- preview app: `pnpm preview`
- generate Prisma client: `pnpm db:generate`
- run Prisma migration: `pnpm db:migrate`
- lint: `pnpm lint`
- lint with fixes: `pnpm lint:fix`
- format check: `pnpm format:check`
- format write: `pnpm format`

## Install and Build Notes

- `postinstall` already runs `prisma generate` and `node scripts/ensure-electron-binary.cjs`.
- If install or runtime setup seems wrong, inspect `package.json` scripts before adding workaround instructions to docs.
- Prefer existing project scripts over ad hoc local commands.
- Do not edit `pnpm-lock.yaml` manually.

## Generated and Managed Files

- Never manually edit `src/generated/prisma/`.
- Never manually edit `pnpm-lock.yaml`.
- Do not change the Prisma client output path in `prisma/schema.prisma`.
- Treat `electron.vite.config.ts` as a central build contract; avoid restructuring it without a clear requirement.
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
- Reuse existing contracts from `src/shared/` and the renderer type layer before creating new ones.
- Put renderer-to-main communication behind the renderer IPC abstraction.

## Documentation Rules

- Keep root `AGENTS.md` short and routing-focused.
- Put deeper agent guidance under `docs/agents/`.
- If docs conflict with source/config, trust the source/config.
- Update agent docs when project structure, shared contracts, or build/runtime assumptions materially change.

## Practical Workflow

For repository-level tasks:

1. Check `package.json` scripts and `electron.vite.config.ts` first.
2. Confirm whether the task touches shared contracts, runtime, renderer, or generated assets.
3. Update the smallest authoritative doc or config that matches the change.
4. Avoid copying stale instructions from `README.md` or older notes into agent docs.
5. If the task is mainly UI or runtime specific, also read `docs/agents/ui.md` or `docs/agents/runtime.md`.

## Avoid

- manual lockfile edits
- manual generated-client edits
- dependency churn without clear need
- repo-wide structural changes that are larger than the task requires
- duplicating commands or requirements in multiple docs unless they truly need to be repeated
