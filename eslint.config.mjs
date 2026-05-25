import prettierConfig from "eslint-config-prettier";
import tseslint from "typescript-eslint";

import { repoOverrideConfigs } from "./eslint/repo-overrides.mjs";
import { sharedCandidateConfigs } from "./eslint/shared-candidates.mjs";

export default tseslint.config(
  {
    ignores: ["**/out/**", "**/dist/**", "**/dist-electron/**", "packages/core/dist-types/**", "packages/core/src/generated/**", "**/*.tsbuildinfo"]
  },
  ...sharedCandidateConfigs,
  ...repoOverrideConfigs,
  prettierConfig
);
