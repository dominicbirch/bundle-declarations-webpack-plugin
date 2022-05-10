import type { EntryPointConfig, CompilationOptions } from "dts-bundle-generator";
import type { Compiler, WebpackPluginInstance } from "webpack";
import { EOL } from "os";


/**The options available for configuring the plugin.  
 * Most of these come from `dts-bundle-generator`.
 */
export interface Options {
    /**The typescript entrypoint(s) to be included in the .d.ts bundle output.
     * `dts-bundle-generator`'s EntryPointConfig may be used for greater control.
     * The value is optional; when omitted the typescript entry files of the webpack bundle will be used.
     * @default DefaultEntryOptions */
    entry?: string | EntryPointConfig | ReadonlyArray<string | EntryPointConfig>;
    /**The output filename including the extension*/
    outFile: string;
    /**The compiler option overrides to be passed to `dts-bundle-generator`.*/
    compilationOptions?: CompilationOptions;
    /**Remove empty and whitespace lines from the output.*/
    removeEmptyLines?: boolean;
    /**Remove empty `export {}`s from the output.*/
    removeEmptyExports?: boolean;
    /**Remove `export * from "./somemodule"` relative re-exporting; this was added to work around a bug in `dts-bundle-generator` 
     * whereby re-exporting would lead to both the relative and qualified paths being included. */
    removeRelativeReExport?: boolean;
}

/**Provides the default plugin options if omitted or partially omitted.*/
export const DefaultOptions: Options = {
    outFile: "index.d.ts",
    removeEmptyLines: true,
    removeEmptyExports: true
};

/**Provides the default entry point config for entries which have no overrides provided. */
export const DefaultEntryOptions = <Partial<EntryPointConfig>>{
    output: {
        sortNodes: true,
        noBanner: true,
    },
};

const
    emptyExports = /^export\s+{\s*};?\s*$/gmi,
    relativeReExport = /^export\s+\*.*?\bfrom\s+"[\.~\/].*$/gmi,
    emptyLines = /^\s*?[\r\n]+/gmi;

/**Creates a bundled d.ts file from the entry point provided after webpack emits output.
 * @class
 * @implements {WebpackPluginInstance}
 */
export class BundleDeclarationsWebpackPlugin implements WebpackPluginInstance {
    /**The plugin options with defaults applied.*/
    protected readonly _options: Options;

    /**Create a new instance of the plugin.
     * @param options The optional configuration to be used by the instance.
     */
    constructor(options?: Partial<Options>) {
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
            pluginName = BundleDeclarationsWebpackPlugin.name,
            { webpack } = compiler,
            { Compilation } = webpack,
            { RawSource } = webpack.sources;

        compiler.hooks.thisCompilation.tap(pluginName, (compilation, params) =>
            compilation.hooks.processAssets.tapPromise({ name: pluginName, stage: Compilation.PROCESS_ASSETS_STAGE_SUMMARIZE }, async assets => {
                const
                    { entry, compilationOptions, outFile, removeEmptyExports, removeEmptyLines, removeRelativeReExport } = this._options,
                    logger = compilation.getLogger(pluginName);

                let entries: EntryPointConfig[];
                if (!entry) {
                    logger.info("No entry point specified, using webpack config for entrypoint(s)");
                    entries = [];
                    compilation.entrypoints.forEach((v, k) => {
                        entries.push(...v.origins
                            .map(o => o.request)
                            .filter(r => r.endsWith(".ts"))
                            .map(r => ({
                                ...DefaultEntryOptions,
                                filePath: r
                            }))
                        );
                    });
                    logger.log(`Found ${entries.length} typescript entrypoints`);
                } else if (typeof entry === "string") {
                    entries = [{
                        ...DefaultEntryOptions,
                        filePath: entry,
                    }];
                } else {
                    entries = Array.isArray(entry)
                        ? entry.map(e => typeof e === "string"
                            ? {
                                ...DefaultEntryOptions,
                                filePath: e
                            } : {
                                ...DefaultEntryOptions,
                                ...e
                            })
                        : [{
                            ...DefaultEntryOptions,
                            ...entry
                        }];
                }

                try {
                    logger.log("Creating .d.ts bundle", ...entries);

                    const
                        { generateDtsBundle } = await import("dts-bundle-generator"),
                        dtsLines = generateDtsBundle(entries, compilationOptions),
                        source = dtsLines
                            .map(dts => removeEmptyExports ? dts?.replace(emptyExports, "") : dts) // export {};
                            .map(dts => removeRelativeReExport ? dts?.replace(relativeReExport, "") : dts) // export * from "./hooks", export * as hooks from "./hooks";
                            .map(dts => removeEmptyLines ? dts?.replace(emptyLines, "")?.trim() : dts)
                            .join(EOL);

                    compilation.emitAsset(outFile, new RawSource(source));

                    logger.log(".d.ts bundle created", outFile);
                } catch (err) {
                    logger.warn("Failed to create .d.ts", err);
                }
            })
        );
    }
}


export {
    BundleDeclarationsWebpackPlugin as default
};
export type { EntryPointConfig, CompilationOptions } from "dts-bundle-generator";