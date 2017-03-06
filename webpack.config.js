var webpack = require("webpack");

module.exports = [
  /* bundle individual files for browsers */
  {
    entry: "./src/json-patch-queue.js",
    output: {
      filename: "dist/json-patch-queue.min.js",
      library: "JSONPatchQueue",
      libraryTarget: "var"
    },
    resolve: {
      extensions: [".js"]
    },
    plugins: [
      new webpack.optimize.UglifyJsPlugin({
        compress: {
          warnings: false
        }
      })
    ]
  },
  /* bundle individual files for browsers */
  {
    entry: "./src/json-patch-queue-synchronous.js",
    output: {
      filename: "dist/json-patch-queue-synchronous.min.js",
      library: "JSONPatchQueueSynchronous",
      libraryTarget: "var"
    },
    resolve: {
      extensions: [".js"]
    },
    plugins: [
      new webpack.optimize.UglifyJsPlugin({
        compress: {
          warnings: false
        }
      })
    ]
  },
  /* now for node, bundle them together, so you can `require` them easily
  for a clearer concept, check src/index.js */
  {
    entry: "./src/index.js",
    output: {
      filename: "dist/json-patch-queue-module.js",
      library: "JSONPatchQueue",
      libraryTarget: "commonjs2"
    },
    resolve: {
      extensions: [".js"]
    }
  }
];
