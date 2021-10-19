# bundle-declarations-webpack-plugin ![NPM version](https://badge.fury.io/js/bundle-declarations-webpack-plugin.svg)
## Example usage

```typescript
import BundleDeclarationsWebpackPlugin from "bundle-declarations-webpack-plugin"

...

    plugins: [
        new BundleDeclarationsWebpackPlugin({
            entry: "./src/index.ts",
            outFile: "index.d.ts"
        })
    ]
```

> The source code for this package also uses the plugin, so this can be used as a demonstration ¯\\\_(ツ)\_/¯