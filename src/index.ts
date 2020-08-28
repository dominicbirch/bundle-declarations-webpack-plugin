import { Options } from "dts-bundle";
import { Compiler } from "webpack";


class CombineDefinitionsWebpackPlugin {
    constructor(readonly options: Options) {
    }

    public apply(compiler: Compiler) {
        compiler.hooks.afterEmit.tapPromise("CombineDefinitionsWebpackPlugin", async () => {
            const dts = await import("dts-bundle");
            dts.bundle(this.options);
        });
    }
}


export { CombineDefinitionsWebpackPlugin, CombineDefinitionsWebpackPlugin as default };