import { Options } from "dts-bundle";
import { Compiler } from "webpack";

/**Creates a bundled d.ts file from the entry point provided after webpack emits output. */
class CombineDeclarationsWebpackPlugin {
    constructor(readonly options: Options) {
    }

    public apply(compiler: Compiler) {
        compiler.hooks.afterEmit.tapPromise("CombineDefinitionsWebpackPlugin", async () => {
            const dts = await import("dts-bundle");
            dts.bundle(this.options);
        });
    }
}


export { CombineDeclarationsWebpackPlugin, CombineDeclarationsWebpackPlugin as default };