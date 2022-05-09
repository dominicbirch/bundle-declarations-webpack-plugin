import * as webpack from "webpack";
import { resolve } from "path";
import BundleDeclarationsWebpackPlugin from "./src";

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
        libraryExport: "default",
        umdNamedDefine: true,
        clean: true,
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.jsx'],
        modules: ["node_modules"]
    },
    module: {
        rules: [
            {
                test: /\.[tj]s$/i,
                include: resolve("./src"),
                exclude: /\.test\.[tj]s$/i,
                use: {
                    loader: "ts-loader",
                    options: {
                        onlyCompileBundledFiles: true,
                    },
                },
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
        webpack: "webpack",
        "dts-bundle-generator": "dts-bundle-generator",
    },
    plugins: [
        new BundleDeclarationsWebpackPlugin({
            entry: "./src/index.ts",
            outFile: "index.d.ts"
        }),
    ],
    optimization: {
        usedExports: true,
    },
};
