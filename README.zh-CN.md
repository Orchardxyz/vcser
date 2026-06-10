<p align="center">
  <img src="assets/logo.svg" alt="vcser logo" width="96" />
</p>

<h1 align="center">vcser</h1>

<p align="center">
  <a href="README.md">English</a> · <a href="README.zh-CN.md">简体中文</a>
</p>

`vcser` 用来在同一台机器上同步不同 Visual Studio Code 系编辑器里的扩展。

当前推荐的使用方式是 CLI：更直接、更轻量，也更适合快速把一个编辑器的扩展状态同步到另一个编辑器。

![vcser CLI 演示](assets/cli-demo.gif)

## 为什么使用 vcser

- 在本地同步不同 Visual Studio Code 系编辑器之间的扩展
- 用交互式 CLI 保持流程简单直接
- 基于共享 core 构建，后续可以支持不止一种使用方式

## 快速开始

环境要求：

- Node.js `>=22.13`

```bash
npx -y @vcser/cli
```

或者全局安装：

```bash
npm install -g @vcser/cli
vcser
```

以上命令都会启动 `vcser` 的 CLI 向导。

如果你只想查看命令帮助：

```bash
vcser --help
```

## Packages

- `packages/cli`：目前使用 `vcser` 的主要方式
- `packages/core`：负责编辑器检测、同步和持久化的共享运行时核心

## Desktop Beta

桌面端目前仍然处于 beta 阶段，敬请期待。
