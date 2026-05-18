# UI Agent Guide

Use this file for renderer, styling, component, page, and theme work in `vcser`.

## Start Here

Read these areas first for most UI tasks:

- `src/renderer/src/`
- `src/renderer/src/components/`
- `src/renderer/src/pages/`
- `src/renderer/src/store/`
- `DESIGN.md`

## Renderer Stack

- React 18 + TypeScript
- Routing is configured in the renderer entry layer under `src/renderer/src/`
- Styling uses Tailwind CSS v4 through `src/renderer/src/styles.css`
- Theme/state uses Zustand in `src/renderer/src/store/`
- Icons use `lucide-react`
- Interaction helpers often use `react-use`

## Styling Rules

- Follow `DESIGN.md` for color, spacing, radius, shadows, and interaction hierarchy.
- Keep the existing Tailwind utility style; do not introduce another styling system.
- Extend design tokens in `src/renderer/src/styles.css` using the existing `@theme` block and root custom properties.
- Prefer existing semantic utility usage in the codebase over ad hoc one-off patterns.
- Reuse current spacing and card/button language before inventing new variants.

## Theme Rules

- Theme mode comes from Zustand via `useAppStore()`.
- The effective theme is resolved in the renderer app shell.
- Apply the resolved theme to `document.documentElement.dataset.theme`.
- Also update `document.documentElement.style.colorScheme` alongside the dataset value.
- Dark theme overrides in `src/renderer/src/styles.css` are keyed off `:root[data-theme="dark"]`.
- Do not move theme state to an inner app container unless the task explicitly requires reworking the theming model.

## Component Defaults

- Reuse shared UI components in `src/renderer/src/components/ui/` before adding new primitives.
- Prefer `BaseModal` for dialogs and overlays.
- Prefer `Button` variants and sizes before introducing another button abstraction.
- Use `Tooltip`, `Popover`, `Toast`, `Select`, and related shared components when they already match the need.
- Use `lucide-react` icons instead of emoji or mixed icon packs.
- Keep interactive states complete: default, hover, active, focus-visible, and disabled.

## Page and Shell Structure

- The app shell lives under `src/renderer/src/`.
- Primary navigation and shared shell components live under `src/renderer/src/components/`.
- Top-level pages currently live under `src/renderer/src/pages/`.
- For route-level changes, check the renderer routing layer under `src/renderer/src/` before adding new navigation logic.
- Preserve the current shell/layout pattern unless a task clearly requires structural UI changes.

## State and Types

- Prefer existing store actions/selectors in `src/renderer/src/store/`.
- Reuse shared contracts from `src/shared/` and the renderer type layer before creating new renderer-only types.
- Keep renderer-to-main calls behind the renderer IPC abstraction.
- Do not pull Prisma or direct filesystem logic into the renderer.

## Practical Workflow

For a typical UI task:

1. Inspect the relevant page/component.
2. Check whether a shared UI primitive already exists.
3. Verify whether types already exist in `src/shared/` or the renderer type layer.
4. Confirm styling decisions against `DESIGN.md` and `src/renderer/src/styles.css`.
5. If the change touches data loading or IPC behavior, also read `docs/agents/runtime.md`.

## Avoid

- adding a new UI framework
- duplicating button, modal, or tooltip primitives
- introducing `any` in renderer code when shared types already exist
- bypassing `invoke()` for renderer-to-main communication
- writing theme logic that disagrees with the renderer app shell and `styles.css`
