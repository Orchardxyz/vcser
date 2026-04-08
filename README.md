# vcser

`vcser` is a desktop app (Tauri + React) that syncs **extensions** and **settings** across VS Code-based editors on the same machine.

## Stack

- Runtime / package manager: **Bun**
- Frontend: **React + Vite + UnoCSS**
- Backend: **Tauri v2 (Rust commands)**

## Scope

- Desktop-only app (no CLI compatibility layer)
- Local dev/build workflow only in this phase

## Supported Editors

Built-in detection includes:

- VSCode
- VSCode Insiders
- VSCodium
- Cursor
- Windsurf
- Kiro
- Trae
- Trae CN
- Antigravity

You can add custom editors from the Step 1 form.

## Features

- 3-step desktop flow (Select → Diff → Sync)
- Extension diff matrix across selected editors
- Settings diff with strict typed mode (`safe` / `exact`)
- Dry-run toggle before real sync
- Settings backup before write (`settings.vcser-backup-YYYYMMDD-HHMMSS.json`)
- Custom editor validation and sanitization in Rust backend

## Security Baseline

- Tauri capability file: `src-tauri/capabilities/default.json`
- Tauri security config: `src-tauri/tauri.conf.json`
- Backend input validation for custom editors:
  - path normalization/canonicalization
  - invalid path rejection
  - CLI command format validation

## Requirements

- Bun `>=1.3`
- Rust toolchain (`cargo`, `rustc`)
- Tauri prerequisites for your OS (WebKitGTK on Linux, Xcode tools on macOS, etc.)
- Editor CLI commands available on `PATH` for extension install/uninstall operations

## Setup

```bash
bun install
```

## Development

Run frontend only:

```bash
bun run dev
```

Run full desktop app:

```bash
bun run tauri:dev
```

## Build

Frontend build:

```bash
bun run build
```

Tauri local build:

```bash
bun run tauri:build
```

## Testing (Minimum Test Bar)

```bash
bun run test
```

This runs:

- Rust unit tests (`compute_extension_diff`, `compute_settings_diff`, `apply_settings_diffs`)
- Rust custom-input validation tests
- Frontend smoke test (`App.test.tsx`) with mocked `invoke()`

## Desktop Flow

1. **Step 1 — Select Editors**
   - Choose at least 2 editors
   - Optionally add custom editor paths/CLI
2. **Step 2 — Review Diffs**
   - Inspect extension matrix
   - Choose settings mode (`safe` or `exact`)
3. **Step 3 — Execute Sync**
   - Select actions
   - Run dry-run or apply real sync
