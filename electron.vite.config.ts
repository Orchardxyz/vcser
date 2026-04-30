import { defineConfig } from "electron-vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const preload = {
  clearScreen: false,
  build: {
    rollupOptions: {
      output: {
        format: "cjs",
      },
    },
  },
} as any;

export default defineConfig({
  main: {
    clearScreen: false,
  },
  preload,
  renderer: {
    clearScreen: false,
    plugins: [react(), tailwindcss()],
  },
});
