import { generateDtsBundle, EntryPointConfig, CompilationOptions } from "dts-bundle-generator";
import { Compiler, WebpackPluginInstance } from "webpack";
import { EOL } from "os";


export interface Options {
    entry: string | EntryPointConfig | ReadonlyArray<string | EntryPointConfig>;

    outFile?: string;
    compilationOptions?: CompilationOptions;
}

export const DefaultEntryOptions = <Partial<EntryPointConfig>>{
    output: {
        sortNodes: true,
        noBanner: true
    }
};

/**Creates a bundled d.ts file from the entry point provided after webpack emits output. */
export class BundleDeclarationsWebpackPlugin implements WebpackPluginInstance {
    static defaultOptions: Partial<Options> = {
        outFile: "index.d.ts"
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
                if (!this.options.entry) {
                    compilation.logger.warn("No options were provided, declaration bundling will be skipped");
                    return;
                }

                let entries: EntryPointConfig[];
                if (typeof this.options.entry === "string") {
                    entries = [{ ...DefaultEntryOptions, filePath: this.options.entry }];
                } else if (Array.isArray(this.options.entry)) {
                    entries = this.options.entry.map(e => typeof e === "string" ? { ...DefaultEntryOptions, filePath: e } : { ...DefaultEntryOptions, ...e });
                } else {
                    entries = [{ ...DefaultEntryOptions, ...<EntryPointConfig>this.options.entry }];
                }

                const
                    dtsLines = generateDtsBundle(entries, this.options.compilationOptions),
                    source = dtsLines.join(EOL);

                compilation.emitAsset(<string>this.options.outFile, new RawSource(source));
            })
        );
    }
}


export {
    BundleDeclarationsWebpackPlugin as default
};
export { EntryPointConfig, CompilationOptions } from "dts-bundle-generator";