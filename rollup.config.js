const commonjs = require("@rollup/plugin-commonjs");
const typescript = require("@rollup/plugin-typescript");
const peerDepsExternal = require("rollup-plugin-peer-deps-external");
const terser = require("@rollup/plugin-terser");
const svg = require("rollup-plugin-svg");
const { babel } = require("@rollup/plugin-babel");

const commonPlugins = [
  peerDepsExternal(),
  svg({ base64: true }),
  commonjs({ include: "node_modules/**" }),
  babel({
    extensions: [".js", ".jsx", ".ts", ".tsx"],
    presets: ["@babel/preset-react"],
    babelHelpers: "bundled",
  }),
  terser(),
];

const external = [
  "react",
  "react-dom",
  "fabric",
  "next",
  "@radix-ui/react-popover",
];

module.exports = [
  // Main bundle (styled components)
  {
    input: "src/components/imageEditor/index.ts",
    output: [
      {
        file: "dist/index.js",
        format: "cjs",
        sourcemap: false,
      },
      {
        file: "dist/index.esm.js",
        format: "esm",
        sourcemap: false,
      },
    ],
    plugins: [
      ...commonPlugins,
      typescript({
        tsconfig: "./tsconfig.json",
        declaration: true,
        declarationDir: "./dist",
        exclude: ["**/*.test.ts", "**/*.test.tsx"],
        outDir: "./dist",
      }),
    ],
    external,
  },

  // Core bundle (headless hooks)
  {
    input: "src/core/index.ts",
    output: [
      {
        file: "dist/core/index.js",
        format: "cjs",
        sourcemap: false,
      },
      {
        file: "dist/core/index.esm.js",
        format: "esm",
        sourcemap: false,
      },
    ],
    plugins: [
      ...commonPlugins,
      typescript({
        tsconfig: "./tsconfig.json",
        declaration: true,
        declarationDir: "./dist/core",
        exclude: ["**/*.test.ts", "**/*.test.tsx"],
        outDir: "./dist/core",
      }),
    ],
    external,
  },
];
