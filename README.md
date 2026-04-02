# vcser

`vcser` is an interactive terminal CLI to sync **extensions** and **settings** across VS Code-based editors on the same machine.

## Supported Editors

Built-in detection currently includes:

- VSCode
- VSCode Insiders
- VSCodium
- Cursor
- Windsurf
- Kiro
- Trae
- Trae CN
- Antigravity

You can also add custom editors via:

- `--custom-json`
- `--custom-file`
- interactive "Add custom editor" flow in Step 1

## Features

- Multi-step Ink TUI (select editors → review diff → apply)
- Extension diff matrix across selected editors
- Settings diff summary (`safe` and `exact` modes)
- Preflight warnings for missing paths and editor CLIs
- `--dry-run` mode for non-destructive preview
- Settings backup before write (`settings.vcser-backup-YYYYMMDD-HHMMSS.json`)

## Requirements

- Bun `>=1.3`
- A terminal that supports interactive TUI
- Editor CLI commands available on `PATH` for extension install/uninstall operations
  - Example: `code`, `cursor`, `windsurf`, etc.

## Install

### From source

```bash
bun install
```

### Build

```bash
bun run build
```

### Run (dev)

```bash
bun run dev
```

## Usage

```bash
vcser [options]
```

Or with source entry:

```bash
bun run src/index.tsx [options]
```

### Options

- `--dry-run`  Preview actions without applying changes
- `--settings-mode <safe|exact>`
  - `safe` (default): add/update keys only
  - `exact`: make destination settings match source (includes deletions)
- `--custom-json '<json>'`  Add a custom editor definition (repeatable)
- `--custom-file <path>`  Load custom editor definitions from a JSON file

## Custom Editor Formats

### `--custom-json`

```bash
vcser --custom-json '{"name":"MyEditor","extensionsPath":"/path/to/extensions","settingsPath":"/path/to/settings.json","cli":"myeditor"}'
```

### `--custom-file`

`editors.json`:

```json
[
  {
    "name": "MyEditorA",
    "extensionsPath": "/path/to/editor-a/extensions",
    "settingsPath": "/path/to/editor-a/settings.json",
    "cli": "myeditor-a"
  },
  {
    "name": "MyEditorB",
    "extensionsPath": "/path/to/editor-b/extensions",
    "settingsPath": "/path/to/editor-b/settings.json",
    "cli": "myeditor-b"
  }
]
```

Run:

```bash
vcser --custom-file ./editors.json
```

## CLI Flow

1. **Step 1 — Select Editors**
   - Choose at least 2 editors
   - Optionally add a custom editor interactively
2. **Step 2 — Review Diffs**
   - Inspect extension matrix
   - Review settings add/update/delete counts
3. **Step 3 — Apply Sync**
   - Select which actions to run
   - Execute in real mode or preview in `--dry-run`

## Testing

```bash
bun test
bunx tsc --noEmit
```

## Notes

- If an editor CLI is missing from `PATH`, extension apply actions for that editor will fail gracefully with an error.
- `vcser` can still compare and sync settings for editors without CLI availability.
