import HtmlWebpackPlugin from "html-webpack-plugin";
import * as path from "path";
import { Configuration } from "webpack";

const rootPath = path.resolve(__dirname, "..");

const config: any = {
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    mainFields: ["main", "module", "browser"],
  },
  entry: path.resolve(rootPath, "src/renderer", "index.tsx"),
  target: "electron-renderer",
  devtool: "source-map",
  module: {
    rules: [
      {
        test: /\.(js|ts|tsx)$/,
        exclude: /node_modules/,
        include: /src/,
        use: {
          loader: "ts-loader",
        },
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: "asset/resource",
      },
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      }
    ],
  },
  devServer: {
    static: {
      directory: path.resolve(rootPath, "dist/renderer"),
      publicPath: "/",
    },
    port: 3000,
    historyApiFallback: true,
    compress: true,
  },
  output: {
    path: path.resolve(rootPath, "dist/renderer"),
    filename: "js/[name].js",
  },
  plugins: [
    new HtmlWebpackPlugin({ template: path.resolve(rootPath, "index.html") }),
  ],
};

export default config;
