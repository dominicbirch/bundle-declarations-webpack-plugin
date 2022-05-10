# bundle-declarations-webpack-plugin 
![NPM version](https://badge.fury.io/js/bundle-declarations-webpack-plugin.svg) 
[![release](https://github.com/dominicbirch/bundle-declarations-webpack-plugin/actions/workflows/release.yml/badge.svg)](https://github.com/dominicbirch/bundle-declarations-webpack-plugin/actions/workflows/release.yml)
[![build](https://github.com/dominicbirch/bundle-declarations-webpack-plugin/actions/workflows/test.yml/badge.svg)](https://github.com/dominicbirch/bundle-declarations-webpack-plugin/actions/workflows/test.yml)
![Code Coverage](https://img.shields.io/badge/Code%20Coverage-100%25-success?style=flat)


## Example usage
Here are some example usages.

### Simplest scenario
As of version 3.1.0, it's possible to omit the configuration overrides; when you do this, the plugin will fallback on `webpack`'s entrypoints and other defaults.
```typescript
import BundleDeclarationsWebpackPlugin from "bundle-declarations-webpack-plugin";
import { resolve } from "path";
import type { Configuration } from "webpack";

export default <Configuration>{
    entry: "./src/main.ts",
    output: {
        filename: "index.js",
        path: resolve("./dist"),
    },
    plugins: [
        `...`,
        new BundleDeclarationsWebpackPlugin(),
    ],
};
```
The configuration above adds the plugin with default options.  All typescript included/imported by the `./src/main.ts` file is transpiled to `./dist/index.js` and all exported types for the bundle are added to the output directory with the default name `index.d.ts`.  

Just to be clear, currently the output filename is defaulted to this value, but the key in `webpack`'s entry is not considered/applied if set as it is with the webpack bundle.

### Most common scenario
Usually you will want to include all types which are visible on the surface of a library, but the `entry` and `outFile` may not necessarily match with your webpack bundle. 
```typescript
import BundleDeclarationsWebpackPlugin from "bundle-declarations-webpack-plugin";

{
   plugins: [
        `...`,
        new BundleDeclarationsWebpackPlugin({
            entry: ["./src/index.ts", "./src/globals.ts"],
            outFile: "main.d.ts",
        }),
    ]
}
```
In the above example, the exports of `index.ts` and `globals.ts` are combined into webpack's output as `main.d.ts`.  

### When you need control of `dts-bundle-generator`
```typescript
import BundleDeclarationsWebpackPlugin from "bundle-declarations-webpack-plugin";

{
    plugins: [
        `...`,
        new BundleDeclarationsWebpackPlugin({
            entry: {
                filePath: "./src/index.ts",
                libraries: {
                    inlinedLibraries: [
                        "tsyringe",
                    ],
                },
                output: {
                    sortNodes: false,
                    // dts-bundle-generator comments in output
                    noBanner: false, 
                }
            },
            outFile: "index.d.ts",

            compilationOptions: {
                followSymlinks: true,
                preferredConfigPath: "./some/tsconfig.json",
            },
            
            // setting these will mean no post-processing
            removeEmptyLines: false,
            removeEmptyExports: false,
            removeRelativeReExport: false,
        }),
    ]
}
```

### Multiple entrypoints with different config
Assuming you want to combine into 1 .d.ts bundle, this can be achieved by providing an array of `EntryPointConfig`s to a single plugin instance's `entry` option.

### Multiple bundles
This is expected, it should be completely safe to use multiple instances of the plugin as part of `webpack`'s parallel builds; in fact the only thing stopping you from reusing the same instance is that the options are shared (which might be fine in some cases).
