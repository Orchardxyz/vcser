import js from "@eslint/js";
import { fileURLToPath } from "node:url";
import tseslint from "typescript-eslint";

const repoRootDir = fileURLToPath(new globalThis.URL("..", import.meta.url));

export const typedLanguageOptions = {
  parserOptions: {
    projectService: true,
    tsconfigRootDir: repoRootDir
  }
};

export const maxLinesRuleOptions = {
  skipBlankLines: true,
  skipComments: true
};

const typeCheckedConfigs = tseslint.configs.recommendedTypeChecked.map((config) => ({
  ...config,
  files: ["**/*.ts", "**/*.tsx"]
}));

const sharedTypeScriptRules = {
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

export const sharedCandidateConfigs = [
  js.configs.recommended,
  ...typeCheckedConfigs,
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: typedLanguageOptions,
    rules: sharedTypeScriptRules
  }
];

export const createDisableTypeCheckedConfig = ({ files, globals }) => ({
  files,
  ...tseslint.configs.disableTypeChecked,
  languageOptions: {
    ...tseslint.configs.disableTypeChecked.languageOptions,
    ...(globals ? { globals } : {})
  }
});
