import * as webpack from "webpack";
import { resolve, join } from "path";
import { CleanWebpackPlugin } from "clean-webpack-plugin";
import CombineDefinitionsWebpackPlugin from "./src";

const
    { name: packageName } = require("./package.json"),
    outDir = resolve("./lib");

export default <webpack.Configuration>{
    target: "node",
    mode: "production",
    entry: "./src/index.ts",
    output: {
        filename: "index.js",
        path: outDir,
        publicPath: "/",
        library: packageName,
        libraryTarget: "umd",
        umdNamedDefine: true
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.jsx'],
        modules: ["node_modules"]
    },
    module: {
        rules: [
            {
                test: /\.[tj]sx?$/i,
                include: resolve("./src"),
                use: {
                    loader: "ts-loader",
                    options: {
                        onlyCompileBundledFiles: true,
                        configFile: resolve("./tsconfig.json")
                    }
                }
            }
        ]
    },
    externals: ["dts-bundle"],
    plugins: [
        new CleanWebpackPlugin({
            dry: false,
            protectWebpackAssets: true,
            cleanStaleWebpackAssets: true,
            cleanOnceBeforeBuildPatterns: [
                resolve("./lib/**/*.*")
            ]
        }),
        new CombineDefinitionsWebpackPlugin({
            name: packageName,
            main: join(outDir, "index.d.ts"),
            out: join(outDir, "index.d.ts"),
            removeSource: true,
            outputAsModuleFolder: true
        })
    ]
};
