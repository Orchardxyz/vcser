import globals from "globals";
import { createDisableTypeCheckedConfig, maxLinesRuleOptions, typedLanguageOptions } from "@oryz/eslint-config";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import pnpm from "eslint-plugin-pnpm";
import * as jsoncParser from "jsonc-eslint-parser";
import * as yamlParser from "yaml-eslint-parser";

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

const vcserPnpmCatalogSortPlugin = {
  rules: {
    "pnpm-sort-catalogs": {
      meta: {
        type: "layout",
        fixable: "code",
        docs: {
          description: "Sort pnpm catalog names and package names"
        },
        schema: [],
        messages: {
          unsortedCatalogs: "pnpm catalogs should be sorted."
        }
      },
      create(context) {
        return {
          Program(node) {
            const sourceCode = context.sourceCode;
            const document = node.body[0];
            const root = document?.content;
            if (root?.type !== "YAMLMapping") return;

            const replacements = [];
            const catalogPair = findPair(root, "catalog");
            const catalogsPair = findPair(root, "catalogs");

            if (catalogPair?.value?.type === "YAMLMapping") {
              const replacement = getSortedMappingReplacement(sourceCode, catalogPair.value, renderOriginalPair);
              if (replacement) replacements.push(replacement);
            }

            if (catalogsPair?.value?.type === "YAMLMapping") {
              const replacement = getSortedMappingReplacement(sourceCode, catalogsPair.value, (_, pair) => renderCatalogPair(sourceCode, pair));
              if (replacement) replacements.push(replacement);
            }

            if (replacements.length === 0) return;

            context.report({
              loc: catalogsPair?.loc ?? catalogPair.loc,
              messageId: "unsortedCatalogs",
              fix: (fixer) => replacements.map((replacement) => fixer.replaceTextRange(replacement.range, replacement.text))
            });
          }
        };
      }
    }
  }
};

function findPair(mapping, key) {
  return mapping.pairs.find((pair) => getPairKey(pair) === key);
}

function getSortedMappingReplacement(sourceCode, mapping, renderPair) {
  if (!mapping.pairs || mapping.pairs.length < 2) return undefined;

  const range = getMappingRange(sourceCode, mapping);
  const sortedPairs = [...mapping.pairs].sort((left, right) => getPairKey(left).localeCompare(getPairKey(right)));
  const sortedText = sortedPairs.map((pair) => renderPair(sourceCode, pair)).join("\n");
  const currentText = sourceCode.text.slice(range[0], range[1]);

  if (sortedText === currentText) return undefined;

  return {
    range,
    text: sortedText
  };
}

function renderCatalogPair(sourceCode, pair) {
  if (pair.value?.type !== "YAMLMapping") return renderOriginalPair(sourceCode, pair);

  const replacement = getSortedMappingReplacement(sourceCode, pair.value, renderOriginalPair);
  if (!replacement) return renderOriginalPair(sourceCode, pair);

  const pairRange = getPairRange(sourceCode, pair);
  return [
    sourceCode.text.slice(pairRange[0], replacement.range[0]),
    replacement.text,
    sourceCode.text.slice(replacement.range[1], pairRange[1])
  ].join("");
}

function renderOriginalPair(sourceCode, pair) {
  const range = getPairRange(sourceCode, pair);
  return sourceCode.text.slice(range[0], range[1]);
}

function getMappingRange(sourceCode, mapping) {
  const firstPair = mapping.pairs[0];
  return [getLineStart(sourceCode.text, firstPair.range[0]), mapping.range[1]];
}

function getPairRange(sourceCode, pair) {
  return [getLineStart(sourceCode.text, pair.range[0]), pair.range[1]];
}

function getLineStart(text, index) {
  return text.lastIndexOf("\n", index - 1) + 1;
}

function getPairKey(pair) {
  return String(pair.key?.value ?? pair.key?.strValue ?? "");
}

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
      "pnpm/json-enforce-catalog": "error",
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
      pnpm,
      vcser: vcserPnpmCatalogSortPlugin
    },
    rules: {
      "pnpm/yaml-no-unused-catalog-item": "error",
      "pnpm/yaml-no-duplicate-catalog-item": "error",
      "vcser/pnpm-sort-catalogs": "error"
    }
  }
];
