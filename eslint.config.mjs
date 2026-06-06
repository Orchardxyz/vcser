import prettierConfig from "eslint-config-prettier";
import { base, typed } from "@oryz/eslint-config";

import { repoOverrideConfigs } from "./eslint/repo-overrides.mjs";

export default [
  {
    ignores: [
      "**/out/**",
      "**/dist/**",
      "**/dist-electron/**",
      "apps/site/.astro/**",
      "apps/desktop/resources/runtime/**",
      "packages/core/dist-types/**",
      "packages/core/src/generated/**",
      "**/*.tsbuildinfo"
    ]
  },
  ...base,
  ...typed,
  ...repoOverrideConfigs,
  prettierConfig
];
