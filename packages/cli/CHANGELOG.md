# @vcser/cli

## 1.1.0

### Minor Changes

- 979bbe9: Add a lightweight CLI i18n layer with localized help text, prompts, summaries, and migration messages.

## 1.0.4

### Patch Changes

- f986e67: Fix CLI package installs by skipping workspace-only Prisma generation during published core package installation.
- Updated dependencies [f986e67]
  - @vcser/core@1.0.2

## 1.0.3

### Patch Changes

- 75e5402: Update the documented `npx` install command to `npx -y @vcser/cli` so npm users can run the CLI without the interactive install confirmation prompt.

## 1.0.2

### Patch Changes

- b3189ed: Fix the documented `npx` install command to use `@vcser/cli`, so npm users can launch the published CLI with the correct package name.

## 1.0.1

### Patch Changes

- e804ecb: Use the full "Visual Studio Code" product name in user-facing labels and copy instead of abbreviated VS Code variants.
- Updated dependencies [e804ecb]
  - @vcser/core@1.0.1

## 1.0.0

### Major Changes

- 05fa8cd: Graduate the desktop, CLI, and core packages from beta and prepare the first stable 1.0.0 release.

### Patch Changes

- 80494b2: Add selective CLI settings sync after extension sync succeeds, including a scoped settings diff table, confirmation prompt, and target settings backup before applying key-level changes.
- 1090681: refactor(core): extract shared error utilities and replace magic error codes
- 22f7029: Fix CLI help output and list detected editors in `vcser editor list`.
- bf182da: Move custom editor storage to a shared JSON file, add an explicit CLI migration for legacy Prisma rows, and stop requiring Prisma-native startup work in the CLI.
- 35dbf3d: Fix release automation so generated Version Packages pull requests trigger required CI checks.
- f3b4096: Prepare npm beta release automation for core and CLI packages.
- 5744bbe: fix(release): dispatch CI after Version Packages PR update
- Updated dependencies [80494b2]
- Updated dependencies [1090681]
- Updated dependencies [afd8fd8]
- Updated dependencies [bf182da]
- Updated dependencies [05fa8cd]
- Updated dependencies [f3b4096]
- Updated dependencies [5744bbe]
- Updated dependencies [a90de06]
- Updated dependencies [69c8c21]
- Updated dependencies [e2ec94b]
- Updated dependencies [b0cf654]
  - @vcser/core@1.0.0

## 0.1.1-beta.9

### Patch Changes

- 80494b2: Add selective CLI settings sync after extension sync succeeds, including a scoped settings diff table, confirmation prompt, and target settings backup before applying key-level changes.
- Updated dependencies [80494b2]
  - @vcser/core@0.1.1-beta.9

## 0.1.1-beta.8

### Patch Changes

- bf182da: Move custom editor storage to a shared JSON file, add an explicit CLI migration for legacy Prisma rows, and stop requiring Prisma-native startup work in the CLI.
- Updated dependencies [bf182da]
  - @vcser/core@0.1.1-beta.8

## 0.1.1-beta.7

### Patch Changes

- Updated dependencies [afd8fd8]
  - @vcser/core@0.1.1-beta.7

## 0.1.1-beta.6

### Patch Changes

- Updated dependencies [e2ec94b]
  - @vcser/core@0.1.1-beta.6

## 0.1.1-beta.5

### Patch Changes

- Updated dependencies [69c8c21]
  - @vcser/core@0.1.1-beta.5

## 0.1.1-beta.4

### Patch Changes

- Updated dependencies [b0cf654]
  - @vcser/core@0.1.1-beta.4

## 0.1.1-beta.3

### Patch Changes

- Updated dependencies [a90de06]
  - @vcser/core@0.1.1-beta.3

## 0.1.1-beta.2

### Patch Changes

- 1090681: refactor(core): extract shared error utilities and replace magic error codes
- 22f7029: Fix CLI help output and list detected editors in `vcser editor list`.
- 35dbf3d: Fix release automation so generated Version Packages pull requests trigger required CI checks.
- 5744bbe: fix(release): dispatch CI after Version Packages PR update
- Updated dependencies [1090681]
- Updated dependencies [5744bbe]
  - @vcser/core@0.1.1-beta.2

## 0.1.1-beta.1

### Patch Changes

- Prepare npm beta release automation for core and CLI packages.
- Updated dependencies
  - @vcser/core@0.1.1-beta.1
