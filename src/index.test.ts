import { resolve } from "path";
import sinon from "ts-sinon";
import { webpack, EnvironmentPlugin } from "webpack";
import BundleDeclarationsWebpackPlugin, { Options } from ".";


describe(BundleDeclarationsWebpackPlugin.name, () => {
    beforeEach(sinon.restore);

    jest.setTimeout(30000);

    const getCompiler = () => webpack({
        entry: "./src/index.ts",
        target: "node",
        mode: "production",
        devtool: false,
        plugins: [
            new EnvironmentPlugin(),
            c => c.hooks.shouldEmit.tap("SuppressEmit", () => false),
        ],
        externalsPresets: { node: true },
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
        }
    });


    it("attempts webpack entry when plugin entry is omitted", done => {
        const
            options = <Options>{
                outFile: "index.d.ts",
            },
            subject = new BundleDeclarationsWebpackPlugin(options),
            compiler = getCompiler();

        subject.apply(compiler);
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
            compiler = getCompiler();

        subject.apply(compiler);
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
            compiler = getCompiler();

        subject.apply(compiler);
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
            compiler = getCompiler();

        subject.apply(compiler);
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
            compiler = getCompiler();

        subject.apply(compiler);
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
        import("dts-bundle-generator").then(generator => {
            const
                options = <Options>{
                    removeRelativeReExport: false,
                    entry: "index.ts",
                    outFile: "failing.d.ts"
                }, subject = new BundleDeclarationsWebpackPlugin(options), compiler = getCompiler();
            sinon
                .stub(generator, "generateDtsBundle")
                .throwsException();

            subject.apply(compiler);
            compiler.run((error, stats) => {
                try {
                    expect(stats?.hasErrors()).toBeFalsy();
                    expect(
                        stats?.compilation.logging
                            .get(BundleDeclarationsWebpackPlugin.name)
                            ?.some(l => l.type === "warn")
                    ).toBeTruthy();
                    expect(stats?.compilation.assets[options.outFile]).toBeFalsy();

                    done(error);
                } catch (e) {
                    done(e);
                }
            });
        });
    });
});