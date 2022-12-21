import type { EntryPointConfig } from "dts-bundle-generator";
import { Buffer } from "node:buffer";
import EventEmitter from "node:events";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { Worker } from "node:worker_threads";
import { Compilation, Compiler, WebpackPluginInstance } from "webpack";
import { compile } from "./generator";
import { DefaultEntryOptions, DefaultOptions, Options } from "./options";


export const PLUGIN_NAME = "BundleDeclarationsWebpackPlugin";

/**Creates a bundled d.ts file from the entry point provided after webpack emits output.
 * @class
 * @implements {WebpackPluginInstance}
 */
export class BundleDeclarationsWebpackPlugin extends EventEmitter implements WebpackPluginInstance {
    /**The plugin options with defaults applied.*/
    protected readonly _options: Options;

    /**Create a new instance of the plugin.
     * @param options The optional configuration to be used by the instance.
     */
    constructor(options?: Partial<Options>) {
        super();
        this._options = options
            ? {
                ...DefaultOptions,
                ...options,
            }
            : DefaultOptions;
    }

    /**@inheritdoc */
    public apply(compiler: Compiler) {
        const
            { webpack: { sources, Compilation }, options: { watch } } = compiler,
            { RawSource } = sources,
            { entry, outFile } = this._options;

        let entries = this.getEntriesFromConfig(entry);

        if (watch) {
            let worker: Worker;

            compiler.hooks.thisCompilation.tap(PLUGIN_NAME, (compilation, _params) => {
                //TODO: seems to always return false, this might be the timing (tried here and while processing assets)
                // if (!compiler.hooks.shouldEmit.call(compilation)) {
                //     return; // No reason to generate .d.ts if there should be no output
                // }
                compilation.hooks.processAssets.tapPromise({ name: PLUGIN_NAME, stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL }, async _assets => {
                    entries ??= this.getDefaultEntries(compilation.entrypoints);

                    worker = new Worker(new URL("./worker", import.meta.url), {
                        workerData: {
                            entries,
                            options: this._options,
                        },
                        stderr: true,
                        stdout: true,
                    });
                    worker.on("message", (data: any) => {
                        this.emit("compiled", data);
                        const path = resolve(compiler.outputPath, outFile);
                        const dir = dirname(path);

                        if (!existsSync(dir)) {
                            mkdirSync(dir, {
                                recursive: true,
                            });
                        }
                        compiler.outputFileSystem.writeFile(path, Buffer.from(data), e => {
                            if (e) {
                                this.emit("error", e);
                            } else {
                                this.emit("updated");
                            }
                        });
                    });
                    worker.on("error", e => this.emit("error", e));
                    worker.on("exit", exitCode => {
                        if (exitCode !== 0) {
                            this.emit("error", new Error(`Background generator exited with code ${exitCode}`));
                        }
                    });
                });
            });

            compiler.hooks.watchClose.tap(PLUGIN_NAME, () => worker?.terminate());
        } else {
            compiler.hooks.thisCompilation.tap(PLUGIN_NAME, (compilation, _params) => {
                compilation.hooks.processAssets.tapPromise({ name: PLUGIN_NAME, stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL }, async (_assets) => {
                    const logger = compilation.getLogger(PLUGIN_NAME);

                    try {
                        entries ??= this.getDefaultEntries(compilation.entrypoints);

                        logger.log("Creating .d.ts bundle", entries);

                        const buffer = await compile(entries, this._options);

                        this.emit("compiled", buffer);
                        compilation.emitAsset(
                            outFile,
                            new RawSource(buffer),
                        );
                        
                        logger.log(".d.ts bundle created", outFile);
                    } catch (err) {
                        logger.warn("Failed to create .d.ts", err);
                        this.emit("error", err);
                    }
                });
            });
        }
    }

    private getDefaultEntries(entry: Compilation["entrypoints"]): EntryPointConfig[] {
        const entries = new Set<EntryPointConfig>();
        for (const [_, v] of entry) {
            for (const o of v.origins) {
                if (o.request?.endsWith(".ts")) {
                    entries.add({
                        ...DefaultEntryOptions,
                        filePath: o.request,
                    });
                }
            }
        }


        return Array.from(entries);
    }
    private getEntriesFromConfig(entry: Options["entry"]): EntryPointConfig[] | undefined {
        if (!entry) {
            return;
        } else if (typeof entry === "string") {
            return [{
                ...DefaultEntryOptions,
                filePath: entry
            }];
        } else {
            return Array.isArray(entry)
                ? entry.map(e => typeof e === "string"
                    ? {
                        ...DefaultEntryOptions,
                        filePath: e,
                    } : {
                        ...DefaultEntryOptions,
                        ...e,
                    })
                : [{
                    ...DefaultEntryOptions,
                    ...entry,
                }];
        }
    }
}

export type { CompilationOptions, EntryPointConfig } from "dts-bundle-generator";
export * from "./options";
export {
    BundleDeclarationsWebpackPlugin as default
};

