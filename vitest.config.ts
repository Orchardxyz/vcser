import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["packages/core/test/**/*.test.ts", "packages/cli/test/**/*.test.ts"],
    exclude: ["packages/core/src/generated/**", "apps/**", "dist-types/**", "dist/**"]
  }
});
