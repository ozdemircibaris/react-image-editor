const resolve = require("@rollup/plugin-node-resolve");
const commonjs = require("@rollup/plugin-commonjs");
const typescript = require("@rollup/plugin-typescript");
const peerDepsExternal = require("rollup-plugin-peer-deps-external");
const terser = require("@rollup/plugin-terser");
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
    resolve({
      extensions: [".js", ".jsx", ".ts", ".tsx"],
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    }),
    commonjs({
      include: "node_modules/**",
    }),
    typescript({
      tsconfig: "./tsconfig.json",
      declaration: true,
      declarationDir: "./dist",
      exclude: ["src/app/**", "**/*.test.ts", "**/*.test.tsx"],
      outDir: "./dist",
    }),
    babel({
      extensions: [".js", ".jsx", ".ts", ".tsx"],
      presets: ["@babel/preset-react"],
      babelHelpers: "bundled",
    }),
    terser(),
  ],
  external: [
    "react",
    "react-dom",
    "fabric",
    "next",
    "@heroui/react",
    "@heroui/system",
    "@heroui/theme",
    "@radix-ui/react-popover",
  ],
};
