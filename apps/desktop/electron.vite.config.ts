import path from "node:path";
import { defineConfig } from "electron-vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

type ElectronViteConfig = Parameters<typeof defineConfig>[0];
type StaticElectronViteConfig = Exclude<Awaited<ElectronViteConfig>, (...args: never[]) => unknown>;
type PreloadConfig = NonNullable<StaticElectronViteConfig["preload"]>;

const root = import.meta.dirname;
const rendererPath = path.resolve(root, "src/renderer/src");
const assetsPath = path.resolve(root, "src/assets");
const coreSrcPath = path.resolve(root, "../../packages/core/src");

const coreAliases: Array<{ find: string; replacement: string }> = [
  { find: "@vcser/core/db", replacement: path.resolve(coreSrcPath, "db.ts") },
  { find: "@vcser/core/editors", replacement: path.resolve(coreSrcPath, "editors") },
  { find: "@vcser/core/i18n", replacement: path.resolve(coreSrcPath, "shared/i18n.ts") },
  { find: "@vcser/core/ipc", replacement: path.resolve(coreSrcPath, "shared/ipc.ts") },
  { find: "@vcser/core/typeGuards", replacement: path.resolve(coreSrcPath, "typeGuards.ts") },
  { find: "@vcser/core/types", replacement: path.resolve(coreSrcPath, "shared/types.ts") },
  { find: "@vcser/core", replacement: path.resolve(coreSrcPath, "index.ts") }
];

const preload = {
  clearScreen: false,
  build: {
    rollupOptions: {
      output: {
        format: "cjs"
      }
    }
  },
  resolve: {
    alias: coreAliases
  }
} as unknown as PreloadConfig;

export default defineConfig({
  main: {
    clearScreen: false,
    resolve: {
      alias: coreAliases
    }
  },
  preload,
  renderer: {
    clearScreen: false,
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: [...coreAliases, { find: "@", replacement: rendererPath }, { find: "@assets", replacement: assetsPath }]
    }
  }
});
