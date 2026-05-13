# Extension Sync By Extension Toolbar Simplification Design

## Summary

Refine the `By Extension` experience in the Extensions tab so the top area behaves like a compact operation bar instead of a dashboard-like summary panel. At the same time, split `src/renderer/src/pages/Overview/components/ExtensionViews.tsx` into smaller renderer components so the container file returns below the agreed file-size threshold without changing feature scope or data-flow semantics.

## Context

The current `By Extension` implementation successfully introduced pair-based sync operations, but the top section now carries too much visual weight:

- Three summary cards compete with the table for attention.
- The toolbar area feels like a secondary dashboard instead of a lightweight control strip.
- `ExtensionViews.tsx` has grown beyond the project’s agreed maximum file length, which makes further iteration risky and harder to review.

The user approved the following direction:

- Use the visual direction corresponding to **Option B**.
- Remove the three large summary cards.
- Keep only the pair selectors, icon-only actions, and a lightweight helper/meta line.
- Split `ExtensionViews.tsx` into focused components while keeping stateful orchestration in the container.

## Goals

- Reduce visual noise at the top of the `By Extension` view.
- Make the table the primary content again.
- Keep sync controls explicit and discoverable.
- Bring `ExtensionViews.tsx` back under the agreed file-length limit.
- Preserve the current pair-based sync workflow and feedback behavior.

## Non-Goals

- No functional redesign of the sync workflow.
- No new filters, tabs, or additional sync modes.
- No backend or IPC contract changes.
- No changes to the `By Editor` view beyond import or composition adjustments if required.
- No new dependencies or UI frameworks.

## UX Design

### Toolbar Structure

The `By Extension` top area should contain only two layers:

1. A compact operation row.
2. A lightweight helper/meta row.

The operation row includes:

- `From` editor select.
- Direction arrow.
- `To` editor select.
- Icon-only `Refresh` button with tooltip.
- Icon-only bulk sync button with tooltip.

The toolbar remains horizontally oriented on wider screens and stacks only when required by responsive constraints.

### Removal of Summary Cards

The following cards are removed entirely:

- `Ready to sync`
- `Selected`
- `In current view`

They currently overstate the importance of support metrics and visually compete with the extension table.

### Lightweight Helper / Meta Row

Instead of cards, the toolbar shows one subtle text row under the controls.

Behavior:

- When the pair is incomplete:
  - Show a concise instruction such as choosing source and target editors to unlock pair-specific status and sync actions.
- When the pair is complete:
  - Show compact, low-emphasis status text derived from existing state in a single line.
  - The default content should follow this structure:
    - `Showing {visibleCount} extensions`
    - `Ready {eligibleCount}`
    - `Selected {selectedCount}` only when `selectedCount > 0`
  - These items may be separated by centered dots or rendered as small neutral pills, but they must remain inline and visually muted.

Presentation rules:

- Use muted text or small neutral badges only.
- No card chrome, no large numeric typography, no shadowed stat surfaces.
- The row should read as context, not as a focal module.

### Visual Hierarchy Rules

The visual order of emphasis should be:

1. Extension table content.
2. Pair selection controls.
3. Helper/meta information.
4. Feedback banner only when present.

This keeps the surface aligned with `DESIGN.md`:

- low noise
- white surfaces
- hierarchy driven by spacing and contrast rather than heavy blocks
- restrained elevation

## Component Split Design

### Container File

`src/renderer/src/pages/Overview/components/ExtensionViews.tsx`

Keep as the stateful container responsible for:

- local UI state
- memoized derived data
- pair selection state
- selected row state
- refresh and single-sync handlers
- modal open/close wiring
- sync completion handling
- passing props into child presentational components

This file should stop owning large presentational blocks.

### New Presentation Components

#### `ExtensionSyncToolbar.tsx`

Responsibilities:

- render the pair selection controls
- render the icon-only toolbar actions
- render the lightweight helper/meta row
- receive all state via props
- remain stateless

Expected inputs include:

- source and target select values
- filtered source and target option arrays
- pair completeness state
- refreshing state
- selected count
- eligible count
- visible count
- event handlers for source change, target change, refresh, and opening bulk sync

#### `ExtensionSyncTable.tsx`

Responsibilities:

- render the table shell
- render empty state inside the table region
- map extension rows into row UI
- render selection checkboxes and row action cell
- stay presentation-oriented, receiving all derived row state from the container or computing only row-local display details

It should not own container-level mutation state.

#### `ExtensionSyncStatus.tsx`

Responsibilities:

- hold small reusable presentational pieces currently embedded in the container
- include components such as:
  - `SyncFeedbackBanner`
  - `PairStatusCell`
  - any stateless inline status atom that is shared by both toolbar and table presentation

This file is intentionally limited to small stateless display units.

## Data Flow and Responsibilities

The current behavioral contract remains unchanged.

- The container computes:
  - `sourceEditor`, `targetEditor`
  - `pairRows`
  - `eligibleRows`
  - `selectedExtensions`
  - sync button tooltip label
  - helper/meta row content
- The toolbar receives values and callbacks only.
- The table receives already-derived selection and sync state plus row callbacks.
- `SyncExtensionModal` remains mounted by the container.
- `invoke("execute_sync")` usage remains in the container’s single-item sync logic.

This preserves existing responsibility boundaries:

- orchestration in the container
- structure in the toolbar and table
- visual atoms in status helpers

## Error Handling

No new error model is introduced.

Existing behavior is preserved:

- refresh uses `try/finally` and keeps the loading indicator local
- single sync still reports success or failure through the feedback banner
- batch sync still reports completion through `SyncExtensionModal` and container-managed feedback

The only UI-level change is that feedback now appears under a smaller toolbar instead of below a stat-card grid.

## Testing and Validation

Validation should cover:

### Interaction

- Both selects still default to empty.
- Select options remain mutually exclusive.
- Refresh icon button remains accessible and functional.
- Bulk sync icon button remains disabled until a valid pair and selection exist.
- Tooltips describe icon actions clearly.

### Rendering

- No summary cards remain in the `By Extension` toolbar.
- Helper/meta row changes correctly between incomplete-pair and complete-pair states.
- Table remains the dominant visual region.
- Feedback banner still renders correctly when sync succeeds or fails.

### Structural

- `ExtensionViews.tsx` falls below the agreed maximum line count.
- New files follow existing renderer conventions and Tailwind usage.
- TypeScript and ESLint pass except for any pre-existing unrelated warnings.

## Rollout Notes

This is a focused refinement, not a product-level redesign. The implementation should be kept local to the existing `Overview` extension components and should avoid opportunistic refactors outside the approved scope.

## Acceptance Criteria

The work is complete when:

- the top summary cards are removed
- the toolbar uses the approved compact Option B structure
- helper/meta information is visually lightweight
- `ExtensionViews.tsx` is reduced below the agreed file-length threshold
- sync behavior and existing pair-selection behavior remain intact
- the renderer passes type-check and relevant lint validation
