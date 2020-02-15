/**
 * This is inherited by the other modules, but can also be overriden as needed
 */
module.exports = {
  mode: "production",
  target: "node",
  performance: {
    hints: false
  },
  entry: "./src/index.ts",
  output: {
    filename: "index.js",
    library: "main",
    libraryTarget: "commonjs2"
  },

  resolve: {
    // Add '.ts' and '.tsx' as resolvable extensions.
    extensions: [".webpack.js", ".web.js", ".ts", ".tsx", ".js"]
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: "awesome-typescript-loader"
      }
    ]
  }
};
