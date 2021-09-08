# Example usage

```typescript
import BundleDeclarationsWebpackPlugin from "bundle-declarations-webpack-plugin"

...

    plugins: [
        new BundleDeclarationsWebpackPlugin({
            name: packageName,
            main: join(outDir, "index.d.ts"),
            out: join(outDir, "index.d.ts"),
            removeSource: true,
            outputAsModuleFolder: true
        })
    ],
```

> The source code for this package also uses the plugin, so this can be used as a demonstration ¯\\\_(ツ)\_/¯