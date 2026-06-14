import { defineConfig, configDefaults } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "./"),
    },
  },
  test: {
    environment: "node",
    include: ["**/*.{test,spec}.ts", "**/*.{test,spec}.tsx"],
    exclude: [...configDefaults.exclude, ".next/**"],
    globals: false,
  },
});
