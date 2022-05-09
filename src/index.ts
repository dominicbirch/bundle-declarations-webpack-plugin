import { generateDtsBundle, EntryPointConfig, CompilationOptions } from "dts-bundle-generator";
import { Compiler, WebpackPluginInstance } from "webpack";
import { EOL } from "os";


export interface Options {
    entry: string | EntryPointConfig | ReadonlyArray<string | EntryPointConfig>;

    outFile?: string;
    compilationOptions?: CompilationOptions;
    removeEmptyLines?: boolean;
    removeEmptyExports?: boolean;
    removeRelativeReExport?: boolean;
}

export const DefaultEntryOptions = <Partial<EntryPointConfig>>{
    output: {
        sortNodes: true,
        noBanner: true
    }
};

const
    emptyExports = /^export\s+{\s*};?\s*$/gmi,
    relativeReExport = /^export\s+\*.*?\bfrom\s+"[\.~\/].*$/gmi,
    emptyLines = /^\s*?[\r\n]+/gmi;

/**Creates a bundled d.ts file from the entry point provided after webpack emits output. */
export class BundleDeclarationsWebpackPlugin implements WebpackPluginInstance {
    static defaultOptions: Partial<Options> = {
        outFile: "index.d.ts",
        removeEmptyLines: true,
        removeEmptyExports: true
    };

    constructor(readonly options: Options) {
        this.options = { ...BundleDeclarationsWebpackPlugin.defaultOptions, ...options }
    }

    public apply(compiler: Compiler) {
        const
            pluginName = BundleDeclarationsWebpackPlugin.name,
            { webpack } = compiler,
            { Compilation } = webpack,
            { RawSource } = webpack.sources;

        compiler.hooks.thisCompilation.tap(pluginName, (compilation, params) =>
            compilation.hooks.processAssets.tapPromise({ name: pluginName, stage: Compilation.PROCESS_ASSETS_STAGE_SUMMARIZE }, async assets => {
                const { entry, compilationOptions, outFile, removeEmptyExports, removeEmptyLines, removeRelativeReExport } = this.options;

                if (!entry) {
                    compilation.logger.warn("No options were provided, declaration bundling will be skipped");
                    return;
                }

                let entries: EntryPointConfig[];
                if (typeof entry === "string") {
                    entries = [{ ...DefaultEntryOptions, filePath: entry }];
                } else if (Array.isArray(entry)) {
                    entries = entry.map(e => typeof e === "string" ? { ...DefaultEntryOptions, filePath: e } : { ...DefaultEntryOptions, ...e });
                } else {
                    entries = [{ ...DefaultEntryOptions, ...<EntryPointConfig>entry }];
                }

                const
                    dtsLines = generateDtsBundle(entries, compilationOptions),
                    source = dtsLines
                        .map(dts => removeEmptyExports ? dts?.replace(emptyExports, "") : dts) // export {};
                        .map(dts => removeRelativeReExport ? dts?.replace(relativeReExport, "") : dts) // export * from "./hooks", export * as hooks from "./hooks";
                        .map(dts => removeEmptyLines ? dts?.replace(emptyLines, "")?.trim() : dts) 
                        .join(EOL);

                compilation.emitAsset(<string>outFile, new RawSource(source));
            })
        );
    }
}


export {
    BundleDeclarationsWebpackPlugin as default
};
export type { EntryPointConfig, CompilationOptions } from "dts-bundle-generator";