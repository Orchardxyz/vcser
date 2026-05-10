import { defineConfig } from "electron-vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

type ElectronViteConfig = Parameters<typeof defineConfig>[0];
type StaticElectronViteConfig = Exclude<Awaited<ElectronViteConfig>, (...args: never[]) => unknown>;
type PreloadConfig = NonNullable<StaticElectronViteConfig["preload"]>;

const preload = {
  clearScreen: false,
  build: {
    rollupOptions: {
      output: {
        format: "cjs"
      }
    }
  }
} as unknown as PreloadConfig;

export default defineConfig({
  main: {
    clearScreen: false
  },
  preload,
  renderer: {
    clearScreen: false,
    plugins: [react(), tailwindcss()]
  }
});
