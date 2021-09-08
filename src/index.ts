import { Options } from "dts-bundle";
import { Compiler, WebpackPluginInstance } from "webpack";

const PluginName = "bundle-declarations-webpack-plugin";

/**Creates a bundled d.ts file from the entry point provided after webpack emits output. */
export class CombineDeclarationsWebpackPlugin implements WebpackPluginInstance {
    constructor(readonly options: Options) {
    }

    public apply(compiler: Compiler) {
        compiler.hooks.afterEmit.tapPromise(PluginName, async () => {
            const dts = await import("dts-bundle");
            dts.bundle(this.options);
        });
    }
}


export { 
    Options,
    CombineDeclarationsWebpackPlugin as default 
};