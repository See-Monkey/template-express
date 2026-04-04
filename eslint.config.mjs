import js from "@eslint/js";
import prettierConfig from "eslint-config-prettier";

export default [
  js.configs.recommended,
  prettierConfig, // Must be last to override conflicting rules
  {
    rules: {
      "no-console": "warn",
      "no-unused-vars": "error",
    },
  },
];
