import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import pnpm from "eslint-plugin-pnpm";
import * as jsoncParser from "jsonc-eslint-parser";
import * as yamlParser from "yaml-eslint-parser";

import { createDisableTypeCheckedConfig, maxLinesRuleOptions, typedLanguageOptions } from "./shared-candidates.mjs";

const nodeTypeScriptFiles = [
  "*.ts",
  "apps/*/electron.vite.config.ts",
  "apps/*/src/main/**/*.ts",
  "apps/*/src/preload/**/*.ts",
  "packages/*/src/**/*.ts"
];

const scriptFiles = [
  "*.js",
  "*.mjs",
  "*.cjs",
  "scripts/**/*.js",
  "scripts/**/*.mjs",
  "scripts/**/*.cjs",
  "apps/*/scripts/**/*.js",
  "apps/*/scripts/**/*.mjs",
  "apps/*/scripts/**/*.cjs",
  "packages/*/scripts/**/*.js",
  "packages/*/scripts/**/*.mjs",
  "packages/*/scripts/**/*.cjs"
];

const reactRefreshAllowedExports = ["BADGE_SIZE", "BADGE_VARIANT", "BUTTON_SIZE", "BUTTON_VARIANT", "EDITOR_IDENTITY_MODE", "PAGE"];

const catalogIgnorePackages = [
  "@hookform/resolvers",
  "@radix-ui/react-dropdown-menu",
  "@radix-ui/react-popover",
  "@radix-ui/react-tooltip",
  "@tailwindcss/vite",
  "@types/prompts",
  "@vitejs/plugin-react",
  "cac",
  "classnames",
  "electron-icon-builder",
  "esbuild",
  "i18next",
  "jsonc-parser",
  "lucide-react",
  "ora",
  "picocolors",
  "prompts",
  "react-diff-viewer-continued",
  "react-hook-form",
  "react-i18next",
  "react-router-dom",
  "react-use",
  "sonner",
  "tailwindcss",
  "vite",
  "zod",
  "zustand"
];

export const repoOverrideConfigs = [
  {
    files: ["**/*.ts"],
    rules: {
      "max-lines": ["warn", { ...maxLinesRuleOptions, max: 300 }]
    }
  },
  {
    files: ["packages/cli/src/**/*.ts"],
    rules: {
      "max-lines": ["warn", { ...maxLinesRuleOptions, max: 450 }]
    }
  },
  {
    files: ["apps/*/src/renderer/src/i18n/**/*.ts"],
    rules: {
      "max-lines": "off",
      "max-len": "off"
    }
  },
  {
    files: ["**/*.tsx"],
    rules: {
      "max-lines": ["warn", { ...maxLinesRuleOptions, max: 350 }]
    }
  },
  {
    files: nodeTypeScriptFiles,
    languageOptions: {
      ...typedLanguageOptions,
      globals: globals.node
    }
  },
  createDisableTypeCheckedConfig({
    files: ["prisma.config.ts"],
    globals: globals.node
  }),
  createDisableTypeCheckedConfig({
    files: ["vitest.config.ts", "packages/*/vitest.config.ts"],
    globals: globals.node
  }),
  {
    files: ["apps/*/src/renderer/src/**/*.ts", "apps/*/src/renderer/src/**/*.tsx"],
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh
    },
    rules: {
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/rules-of-hooks": "error",
      "react-refresh/only-export-components": [
        "warn",
        {
          allowConstantExport: true,
          allowExportNames: reactRefreshAllowedExports
        }
      ]
    },
    languageOptions: {
      ...typedLanguageOptions,
      globals: globals.browser
    }
  },
  {
    files: scriptFiles,
    languageOptions: {
      globals: globals.node
    },
    rules: {
      "no-console": "off"
    }
  },
  {
    files: ["packages/cli/src/logger.ts"],
    rules: {
      "no-console": "off"
    }
  },
  {
    files: ["package.json", "**/package.json"],
    languageOptions: {
      parser: jsoncParser
    },
    plugins: {
      pnpm
    },
    rules: {
      "pnpm/json-enforce-catalog": [
        "error",
        {
          ignores: catalogIgnorePackages
        }
      ],
      "pnpm/json-valid-catalog": "error",
      "pnpm/json-prefer-workspace-settings": "error"
    }
  },
  {
    files: ["pnpm-workspace.yaml"],
    languageOptions: {
      parser: yamlParser
    },
    plugins: {
      pnpm
    },
    rules: {
      "pnpm/yaml-no-unused-catalog-item": "error",
      "pnpm/yaml-no-duplicate-catalog-item": "error"
    }
  }
];
