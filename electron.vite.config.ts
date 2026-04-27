import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import react from "@vitejs/plugin-react";
import UnoCSS from "unocss/vite";

export default defineConfig({
  main: {
    clearScreen: false,
    plugins: [externalizeDepsPlugin()],
  },
  preload: {
    clearScreen: false,
    plugins: [externalizeDepsPlugin()],
  },
  renderer: {
    clearScreen: false,
    plugins: [react(), UnoCSS()],
  },
});
