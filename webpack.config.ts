import * as webpack from "webpack";
import { resolve, join } from "path";
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
        umdNamedDefine: true,
        clean: true
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
                        onlyCompileBundledFiles: true
                    }
                }
            }
        ]
    },
    externals: {
        lodash: {
            commonjs: 'lodash',
            commonjs2: 'lodash',
            amd: 'lodash',
            root: '_',
        },
        "dts-bundle": "dts-bundle"
    },
    plugins: [
        new CombineDefinitionsWebpackPlugin({
            name: packageName,
            main: join(outDir, "index.d.ts"),
            out: join(outDir, "index.d.ts"),
            removeSource: true,
            outputAsModuleFolder: true
        })
    ],
    optimization: {
        usedExports: true
    }
};
