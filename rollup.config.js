const commonjs = require("@rollup/plugin-commonjs");
const typescript = require("@rollup/plugin-typescript");
const peerDepsExternal = require("rollup-plugin-peer-deps-external");
const terser = require("@rollup/plugin-terser");
const svg = require("rollup-plugin-svg");
const path = require("path");
const { babel } = require("@rollup/plugin-babel");

module.exports = {
  input: "src/components/imageEditor/index.ts",
  output: [
    {
      file: "dist/index.js",
      format: "cjs",
      sourcemap: true,
    },
    {
      file: "dist/index.esm.js",
      format: "esm",
      sourcemap: true,
    },
  ],
  plugins: [
    peerDepsExternal(),
    svg({
      base64: true,
    }),
    commonjs({
      include: "node_modules/**",
    }),
    typescript({
      tsconfig: "./tsconfig.json",
      declaration: true,
      declarationDir: "./dist",
      exclude: ["**/*.test.ts", "**/*.test.tsx"],
      outDir: "./dist",
    }),
    babel({
      extensions: [".js", ".jsx", ".ts", ".tsx"],
      presets: ["@babel/preset-react"],
      babelHelpers: "bundled",
    }),
    terser(),
  ],
  external: ["react", "react-dom", "fabric", "next", "@radix-ui/react-popover"],
};
