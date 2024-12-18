import type { EntryPointConfig } from "dts-bundle-generator";
import { Buffer } from "node:buffer";
import EventEmitter from "node:events";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { Worker } from "node:worker_threads";
import { Compilation, Compiler, NormalModule, WebpackPluginInstance } from "webpack";
import { compile } from "./generator";
import { DefaultEntryOptions, DefaultOptions, Options } from "./options";


export const PLUGIN_NAME = "BundleDeclarationsWebpackPlugin";

export type PluginEventMap = {
    compiled: [data: Buffer];
    error: [err: Error];
    updated: [];
}

/**Creates a bundled d.ts file from the entry point provided after webpack emits output.
 * @class
 * @implements {WebpackPluginInstance}
 */
export class BundleDeclarationsWebpackPlugin extends EventEmitter<PluginEventMap> implements WebpackPluginInstance {
    /**The plugin options with defaults applied.*/
    protected readonly _options: Options;

    /**Create a new instance of the plugin.
     * @param options The optional configuration to be used by the instance.
     */
    constructor(options?: Partial<Options>) {
        super({ captureRejections: true });
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
            { entry, outFile, blockingWatch } = this._options;

        let entries = this.getEntriesFromConfig(entry);

        if (watch && !blockingWatch) {
            let worker: Worker;
            compiler.hooks.thisCompilation.tap(PLUGIN_NAME, (compilation, _params) => {
                //TODO: seems to always return false, this might be the timing (tried here and while processing assets)
                // if (!compiler.hooks.shouldEmit.call(compilation)) {
                //     return; // No reason to generate .d.ts if there should be no output
                // }
                compilation.hooks.processAssets.tapPromise({ name: PLUGIN_NAME, stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL }, async _assets => {
                    entries ??= this.getDefaultEntries(compilation);

                    worker = new Worker(new URL("./worker", import.meta.url), {
                        workerData: {
                            entries,
                            options: this._options,
                        },
                        stderr: true,
                        stdout: true,
                    })
                        .on("message", (data: any) => {
                            this.emit("compiled", data);
                            const path = resolve(compiler.outputPath, outFile);
                            const dir = dirname(path);

                            if (!existsSync(dir)) {
                                mkdirSync(dir, {
                                    recursive: true,
                                });
                            }
                            compiler.outputFileSystem?.writeFile(path, Buffer.from(data), e => {
                                if (e) {
                                    this.emit("error", e);
                                } else {
                                    this.emit("updated");
                                }
                            });
                        })
                        .on("error", e => this.emit("error", e))
                        .on("exit", exitCode => {
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
                        entries ??= this.getDefaultEntries(compilation);

                        logger.log("Creating .d.ts bundle", entries);

                        compilation.emitAsset(
                            outFile,
                            new RawSource(await compile(entries, this._options)),
                        );

                        logger.log(".d.ts bundle created", outFile);
                    } catch (err) {
                        logger.warn("Failed to create .d.ts", err);
                    }
                });
            });
        }
    }

    private getDefaultEntries(compilation: Compilation): EntryPointConfig[] {
        const entries = new Set<EntryPointConfig>();
        for (const entrypoint of compilation.entrypoints.values()) {
            for (const chunk of entrypoint.chunks) {
                const modules = compilation.chunkGraph.getChunkModulesIterable(chunk);
                for (const module of modules) {
                    const { resource } = module as NormalModule;
                    if (resource && resource.endsWith(".ts")) {
                        entries.add({
                            ...DefaultEntryOptions,
                            filePath: resource,
                        });
                    }
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
    compile,
};
export default BundleDeclarationsWebpackPlugin;