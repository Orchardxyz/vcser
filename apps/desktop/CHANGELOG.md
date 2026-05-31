# @vcser/desktop

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

- 7c55ce8: Disable electron-builder auto publishing and fix packaged desktop artifacts.

## 0.1.1-beta.1

### Patch Changes

- 2ed33f1: Fix desktop release packaging and allow GitHub Releases when another publish channel succeeds.

## 0.1.1-beta.0

### Patch Changes

- 1090681: refactor(core): extract shared error utilities and replace magic error codes
- 5744bbe: fix(release): dispatch CI after Version Packages PR update
