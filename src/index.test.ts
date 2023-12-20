import { resolve } from "node:path";
import { existsSync, rmSync } from "node:fs";
import type { Options } from "./options";
import webpack from "webpack";
import BundleDeclarationsWebpackPlugin, { PLUGIN_NAME } from ".";
import PluginOutput from "../dist";
import { jest } from "@jest/globals";


describe(BundleDeclarationsWebpackPlugin.name, () => {
    jest.setTimeout(30000);
    afterAll(() => {
        const outputPath = new URL("../test", import.meta.url);
        if (existsSync(outputPath)) {
            rmSync(outputPath, {
                recursive: true,
                force: true,
            });
        }
    });

    const getCompiler = ({ watch, cb, plugins }: { watch?: boolean, plugins?: webpack.Configuration["plugins"], cb?: (err?: Error, stats?: webpack.Stats) => void } = { watch: false }) => webpack({
        watch,
        entry: "./src/index.ts",
        target: "node",
        mode: "production",
        devtool: false,
        plugins: [
            ...plugins ?? [],
            c => c.hooks.shouldEmit.tap("SuppressEmit", () => false),
        ],
        output: {
            path: resolve("./test"),
            pathinfo: false,
            publicPath: "/",
        },
        externalsPresets: { node: true },
        externals: {
            webpack: "webpack",
            "dts-bundle-generator": "dts-bundle-generator",
        },
        resolve: {
            modules: ["node_modules"],
            extensions: [".ts", ".js", ".json", ".mjs", ".cjs"],
        },
        module: {
            rules: [
                {
                    test: /\.ts$/i,
                    include: resolve("./src"),
                    exclude: /\.test\.[tj]s$/i,
                    use: {
                        loader: "ts-loader",
                        options: {
                            onlyCompileBundledFiles: true,
                            transpileOnly: true,
                        },
                    },
                }
            ]
        },
        optimization: {
            minimize: false,
            concatenateModules: false,
            removeEmptyChunks: false,
            mergeDuplicateChunks: false,
            usedExports: true,
        }
    }, cb);


    it("attempts webpack entry when plugin entry is omitted", done => {
        const
            options = <Options>{
                outFile: "index.d.ts",
            },
            subject = new BundleDeclarationsWebpackPlugin(options),
            compiler = getCompiler({ plugins: [subject] });

        compiler.run((error, stats) => {
            try {
                expect(stats?.hasErrors()).toBeFalsy();
                expect(stats?.compilation.assets[options.outFile]).toBeTruthy();

                done(error);
            } catch (e) {
                done(e);
            }
        });
    });
    it("generates a .d.ts bundle for a single string entry-point", done => {
        const
            options = <Options>{
                entry: "./src/index.ts",
                outFile: "test.d.ts",
            },
            subject = new BundleDeclarationsWebpackPlugin(options),
            compiler = getCompiler({ plugins: [subject] });

        compiler.run((error, stats) => {
            try {
                expect(stats?.hasErrors()).toBeFalsy();
                expect(stats?.compilation.assets[options.outFile]).toBeTruthy();

                done(error);
            } catch (e) {
                done(e);
            }
        });
    });
    it("generates a .d.ts bundle for multiple string entry-points", done => {
        const
            options = <Options>{
                entry: ["./src/index.ts"],
                outFile: "main.d.ts",
            },
            subject = new BundleDeclarationsWebpackPlugin(options),
            compiler = getCompiler({ plugins: [subject] });

        compiler.run((error, stats) => {
            try {
                expect(stats?.hasErrors()).toBeFalsy();
                expect(stats?.compilation.assets[options.outFile]).toBeTruthy();

                done(error);
            } catch (e) {
                done(e);
            }
        });
    });
    it("generates a .d.ts bundle for a single EntryPointConfig", done => {
        const
            options = <Options>{
                removeEmptyLines: false,
                removeEmptyExports: false,
                entry: {
                    filePath: "./src/index.ts",
                },
                outFile: "main.d.ts",
            },
            subject = new BundleDeclarationsWebpackPlugin(options),
            compiler = getCompiler({ plugins: [subject] });

        compiler.run((error, stats) => {
            try {
                expect(stats?.hasErrors()).toBeFalsy();
                expect(stats?.compilation.assets[options.outFile]).toBeTruthy();

                done(error);
            } catch (e) {
                done(e);
            }
        });
    });
    it("generates a .d.ts bundle for an array of EntryPointConfigs", done => {
        const
            options = <Options>{
                removeRelativeReExport: false,
                entry: [{
                    filePath: "./src/index.ts",
                    output: {
                        sortNodes: false,
                        noBanner: false,
                    },
                }],
                outFile: "multi.d.ts",
            },
            subject = new BundleDeclarationsWebpackPlugin(options),
            compiler = getCompiler({ plugins: [subject] });

        compiler.run((error, stats) => {
            try {
                expect(stats?.hasErrors()).toBeFalsy();
                expect(stats?.compilation.assets[options.outFile]).toBeTruthy();

                done(error);
            } catch (e) {
                done(e);
            }
        });
    });
    it("logs a warning and continues if .d.ts bundling fails", done => {
        const
            options = <Options>{
                removeRelativeReExport: false,
                entry: "_failme_!.ts",
                outFile: "#failing.d.ts"
            }, subject = new BundleDeclarationsWebpackPlugin(options),
            compiler = getCompiler({ plugins: [subject] });

        compiler.run((error, stats) => {
            if(error){
                return done(error);
            }
            try {
                const logs = stats?.compilation.logging.get(PLUGIN_NAME);
                expect(stats?.hasErrors()).toBeFalsy();
                expect(stats?.compilation.assets[options.outFile]).toBeFalsy();
                expect(logs?.some(l => l.type === "warn")).toBeTruthy();
                done();
            } catch (e) {
                done(e);
            }
        });
    });
    it("runs in a background thread in webpack watch mode", done => {
        const
            options = <Options>{
                outFile: "main.d.ts",
            },
            //TODO: jest cant seem to resolve the worker as a module from the .ts version
            subject = new PluginOutput(options)
                .on("updated", () => {
                    try {
                        expect(existsSync(resolve(compiler.outputPath, options.outFile))).toBe(true);
                        compiler.close(done);
                    } catch (e) {
                        done(e);
                    }
                })
                .on("error", e => done(e)),
            compiler = getCompiler({
                watch: true,
                plugins: [subject],
                cb: (err, stats) => {
                    if (err) {
                        return done(err);
                    }

                    try {
                        expect(stats?.hasErrors()).toBeFalsy();
                        expect(stats?.compilation.assets[options.outFile]).toBeFalsy();
                    } catch (e) {
                        done(e);
                    }
                }
            });
    });
});