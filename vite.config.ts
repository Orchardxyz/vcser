import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import UnoCSS from "unocss/vite";

const isTauriDebug = process.env.TAURI_ENV_DEBUG !== undefined;
const isWindows = process.env.TAURI_ENV_PLATFORM === "windows";

export default defineConfig(() => ({
  clearScreen: false,
  plugins: [react(), UnoCSS()],
  server: {
    host: "127.0.0.1",
    port: 1420,
    strictPort: true,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
  build: {
    target: isWindows ? "chrome105" : "safari13",
    minify: isTauriDebug ? false : ("esbuild" as const),
    sourcemap: isTauriDebug,
  },
}));
