<p align="center">
  <img src="https://raw.githubusercontent.com/Orchardxyz/vcser/main/assets/logo.svg" alt="vcser logo" width="96" />
</p>

<h1 align="center">@vcser/cli</h1>

<p align="center">
  <a href="README.md">English</a> · <a href="README.zh-CN.md">简体中文</a>
</p>

CLI for syncing extensions across VS Code-based editors on the same machine.

`@vcser/cli` is the recommended way to use `vcser` today.

![vcser CLI demo](https://raw.githubusercontent.com/Orchardxyz/vcser/main/assets/cli-demo.gif)

## Install

```bash
npx vcser
```

Or install it globally:

```bash
npm install -g @vcser/cli
vcser
```

## What It Does

- Detect supported VS Code-based editors
- Compare local extension state
- Sync extensions from one editor to another
- Manage custom editors from the CLI

## Common Commands

```bash
vcser
vcser --help
vcser editor list
vcser editor add
vcser editor update <id-or-slug>
vcser editor remove <id-or-slug>
vcser reset
```

## Requirements

- Node.js `>=22.13`
