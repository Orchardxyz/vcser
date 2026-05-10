import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import prettierConfig from "eslint-config-prettier";
import globals from "globals";

export default tseslint.config(
  { ignores: ["out/**", "dist/**", "src/generated/**", "*.tsbuildinfo"] },

  // Base JS/TS rules for all authored files
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Root config files (electron.vite.config.ts etc.)
  {
    files: ["electron.vite.config.ts"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: globals.node,
    },
  },

  // Electron main process
  {
    files: ["src/main/**/*.ts"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: globals.node,
    },
  },

  // Preload
  {
    files: ["src/preload/**/*.ts"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: globals.node,
    },
  },

  // Renderer (web)
  {
    files: ["src/renderer/src/**/*.ts", "src/renderer/src/**/*.tsx"],
    ...reactHooks.configs.recommended,
    plugins: { "react-refresh": reactRefresh },
    rules: {
      "react-refresh/only-export-components": [
        "warn",
        {
          allowConstantExport: true,
          allowExportNames: [
            "BADGE_SIZE",
            "BADGE_VARIANT",
            "BUTTON_SIZE",
            "BUTTON_VARIANT",
            "EDITOR_IDENTITY_MODE",
            "PAGE",
          ],
        },
      ],
    },
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: globals.browser,
    },
  },

  // Shared types referenced by both node and web tsconfigs
  {
    files: ["src/renderer/src/types.ts"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // Root-level config/script files (JS/MJS/CJS)
  {
    files: ["*.mjs", "*.cjs"],
    languageOptions: {
      globals: globals.node,
    },
  },

  prettierConfig,
);
