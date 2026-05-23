import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import prettierConfig from "eslint-config-prettier";
import globals from "globals";

const typedLanguageOptions = {
  parserOptions: {
    projectService: true,
    tsconfigRootDir: import.meta.dirname
  }
};

const typeCheckedConfigs = tseslint.configs.recommendedTypeChecked.map((config) => ({
  ...config,
  files: ["**/*.ts", "**/*.tsx"]
}));

const maxLinesRuleOptions = {
  skipBlankLines: true,
  skipComments: true
};

const personalTypeScriptRules = {
  "@typescript-eslint/consistent-type-imports": [
    "warn",
    {
      prefer: "type-imports",
      fixStyle: "separate-type-imports"
    }
  ],
  "@typescript-eslint/no-base-to-string": "off",
  "@typescript-eslint/no-floating-promises": "off",
  "@typescript-eslint/no-unnecessary-type-assertion": "off",
  "@typescript-eslint/no-unused-vars": [
    "warn",
    {
      argsIgnorePattern: "^_",
      caughtErrors: "all",
      caughtErrorsIgnorePattern: "^_",
      destructuredArrayIgnorePattern: "^_",
      ignoreRestSiblings: true,
      varsIgnorePattern: "^_"
    }
  ],
  "@typescript-eslint/require-await": "off",
  "no-nested-ternary": "error",
  "no-void": "error",
  "no-restricted-syntax": [
    "error",
    {
      selector: "CallExpression[optional=false] > ArrowFunctionExpression.callee",
      message: "Do not use immediately invoked function expressions (IIFEs). Extract to a named function instead."
    },
    {
      selector: "CallExpression[optional=false] > FunctionExpression.callee",
      message: "Do not use immediately invoked function expressions (IIFEs). Extract to a named function instead."
    }
  ],
  "no-console": [
    "error",
    {
      allow: ["warn", "error", "info"]
    }
  ]
};

export default tseslint.config(
  {
    ignores: ["**/out/**", "**/dist/**", "**/dist-electron/**", "packages/core/dist-types/**", "packages/core/src/generated/**", "**/*.tsbuildinfo"]
  },

  // Base JS/TS rules for all authored files
  js.configs.recommended,
  ...typeCheckedConfigs,

  // Shared TypeScript behavior
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: typedLanguageOptions,
    rules: personalTypeScriptRules
  },

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

  // Root config files and node-side TypeScript
  {
    files: ["*.ts", "apps/*/electron.vite.config.ts", "apps/*/src/main/**/*.ts", "apps/*/src/preload/**/*.ts", "packages/*/src/**/*.ts"],
    languageOptions: {
      ...typedLanguageOptions,
      globals: globals.node
    }
  },

  {
    files: ["prisma.config.ts"],
    ...tseslint.configs.disableTypeChecked,
    languageOptions: {
      ...tseslint.configs.disableTypeChecked.languageOptions,
      globals: globals.node
    }
  },

  {
    files: ["vitest.config.ts", "packages/*/vitest.config.ts"],
    ...tseslint.configs.disableTypeChecked,
    languageOptions: {
      ...tseslint.configs.disableTypeChecked.languageOptions,
      globals: globals.node
    }
  },

  // Renderer (web)
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
          allowExportNames: ["BADGE_SIZE", "BADGE_VARIANT", "BUTTON_SIZE", "BUTTON_VARIANT", "EDITOR_IDENTITY_MODE", "PAGE"]
        }
      ]
    },
    languageOptions: {
      ...typedLanguageOptions,
      globals: globals.browser
    }
  },

  // Root-level config/script files (JS/MJS/CJS)
  {
    files: [
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
    ],
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

  prettierConfig
);
