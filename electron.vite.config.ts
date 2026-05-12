import path from "node:path";
import { defineConfig } from "electron-vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

type ElectronViteConfig = Parameters<typeof defineConfig>[0];
type StaticElectronViteConfig = Exclude<Awaited<ElectronViteConfig>, (...args: never[]) => unknown>;
type PreloadConfig = NonNullable<StaticElectronViteConfig["preload"]>;

const root = import.meta.dirname;
const sharedPath = path.resolve(root, "src/shared");
const generatedPath = path.resolve(root, "src/generated");
const rendererPath = path.resolve(root, "src/renderer/src");
const assetsPath = path.resolve(root, "src/assets");

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
    alias: {
      "@shared": sharedPath,
      "@generated": generatedPath
    }
  }
} as unknown as PreloadConfig;

export default defineConfig({
  main: {
    clearScreen: false,
    resolve: {
      alias: {
        "@shared": sharedPath,
        "@generated": generatedPath
      }
    }
  },
  preload,
  renderer: {
    clearScreen: false,
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": rendererPath,
        "@shared": sharedPath,
        "@assets": assetsPath
      }
    }
  }
});
