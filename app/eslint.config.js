// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    rules: {
      // react-native-web has no useAnimatedValue: the web build crashes. Use src/ui/motion's.
      "no-restricted-imports": ["error", { paths: [{ name: "react-native", importNames: ["useAnimatedValue"], message: "Import useAnimatedValue from src/ui/motion (react-native-web lacks it)." }] }],
    },
  },
]);
