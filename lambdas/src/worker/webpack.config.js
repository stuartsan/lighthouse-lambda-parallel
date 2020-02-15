const TerserPlugin = require("terser-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const webpackConfig = require("../webpackParent.config");
const nodeExternals = require("webpack-node-externals");

module.exports = Object.assign(webpackConfig, {
  plugins: [new CleanWebpackPlugin()],
  // devtool: "inline-source-map",
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        extractComments: false
      })
    ]
  },
  externals: [nodeExternals()]
});
