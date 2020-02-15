const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const webpackConfig = require("../webpackParent.config");
const nodeExternals = require("webpack-node-externals");

module.exports = Object.assign(webpackConfig, {
  plugins: [new CleanWebpackPlugin()],
  externals: [nodeExternals()]
});
