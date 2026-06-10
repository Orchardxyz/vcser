<p align="center">
  <img src="https://raw.githubusercontent.com/Orchardxyz/vcser/main/assets/logo.svg" alt="vcser logo" width="96" />
</p>

<h1 align="center">@vcser/cli</h1>

<p align="center">
  <a href="README.md">English</a> · <a href="README.zh-CN.md">简体中文</a>
</p>

用于在同一台机器上同步不同 Visual Studio Code 系编辑器扩展的 CLI。

`@vcser/cli` 是目前使用 `vcser` 的推荐方式。

![vcser CLI 演示](https://raw.githubusercontent.com/Orchardxyz/vcser/main/assets/cli-demo.gif)

## 安装

```bash
npx @vcser/cli
```

或者全局安装：

```bash
npm install -g @vcser/cli
vcser
```

## 能做什么

- 检测受支持的 Visual Studio Code 系编辑器
- 比较本地扩展状态
- 将扩展从一个编辑器同步到另一个编辑器
- 在 CLI 中管理自定义编辑器

## 常用命令

```bash
vcser
vcser --help
vcser editor list
vcser editor add
vcser editor update <id-or-slug>
vcser editor remove <id-or-slug>
vcser reset
```

## 环境要求

- Node.js `>=22.13`
