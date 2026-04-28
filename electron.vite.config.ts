import { defineConfig } from "electron-vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  main: {
    clearScreen: false,
  },
  preload: {
    clearScreen: false,
  },
  renderer: {
    clearScreen: false,
    plugins: [react(), tailwindcss()],
  },
});
