# @vcser/core

## 1.0.3

### Patch Changes

- cec1b27: Add package keywords metadata for better package discovery.

## 1.0.2

### Patch Changes

- f986e67: Fix CLI package installs by skipping workspace-only Prisma generation during published core package installation.

## 1.0.1

### Patch Changes

- e804ecb: Use the full "Visual Studio Code" product name in user-facing labels and copy instead of abbreviated VS Code variants.

## 1.0.0

### Major Changes

- 05fa8cd: Graduate the desktop, CLI, and core packages from beta and prepare the first stable 1.0.0 release.

### Patch Changes

- 80494b2: Add selective CLI settings sync after extension sync succeeds, including a scoped settings diff table, confirmation prompt, and target settings backup before applying key-level changes.
- 1090681: refactor(core): extract shared error utilities and replace magic error codes
- afd8fd8: Move the core TypeScript build info file outside the publishable dist directory.
- bf182da: Move custom editor storage to a shared JSON file, add an explicit CLI migration for legacy Prisma rows, and stop requiring Prisma-native startup work in the CLI.
- f3b4096: Prepare npm beta release automation for core and CLI packages.
- 5744bbe: fix(release): dispatch CI after Version Packages PR update
- a90de06: Stabilize desktop release artifact packaging across Windows and supported desktop targets.
- 69c8c21: Fix Windows installs by invoking the pnpm command shim from the core postinstall script.
- e2ec94b: Fix Windows release installs by running the local Prisma CLI directly from core postinstall.
- b0cf654: Fix Windows desktop packaging by generating Prisma assets from a Windows-safe postinstall path and publishing available desktop artifacts from partial matrix builds.

## 0.1.1-beta.9

### Patch Changes

- 80494b2: Add selective CLI settings sync after extension sync succeeds, including a scoped settings diff table, confirmation prompt, and target settings backup before applying key-level changes.

## 0.1.1-beta.8

### Patch Changes

- bf182da: Move custom editor storage to a shared JSON file, add an explicit CLI migration for legacy Prisma rows, and stop requiring Prisma-native startup work in the CLI.

## 0.1.1-beta.7

### Patch Changes

- afd8fd8: Move the core TypeScript build info file outside the publishable dist directory.

## 0.1.1-beta.6

### Patch Changes

- e2ec94b: Fix Windows release installs by running the local Prisma CLI directly from core postinstall.

## 0.1.1-beta.5

### Patch Changes

- 69c8c21: Fix Windows installs by invoking the pnpm command shim from the core postinstall script.

## 0.1.1-beta.4

### Patch Changes

- b0cf654: Fix Windows desktop packaging by generating Prisma assets from a Windows-safe postinstall path and publishing available desktop artifacts from partial matrix builds.

## 0.1.1-beta.3

### Patch Changes

- a90de06: Stabilize desktop release artifact packaging across Windows and supported desktop targets.

## 0.1.1-beta.2

### Patch Changes

- 1090681: refactor(core): extract shared error utilities and replace magic error codes
- 5744bbe: fix(release): dispatch CI after Version Packages PR update

## 0.1.1-beta.1

### Patch Changes

- Prepare npm beta release automation for core and CLI packages.
