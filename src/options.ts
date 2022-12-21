import type { EntryPointConfig, CompilationOptions } from "dts-bundle-generator";

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