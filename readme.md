# Example usage

```typescript
import CombineDefinitionsWebpackPlugin from "combine-definitions-webpack-plugin"

...

    plugins: [
        ...
        new CombineDefinitionsWebpackPlugin({
            name: require("package.json")["name"],
            main: "./dist/index.d.ts",
            out: "./dist/index.d.ts",
            removeSource: true,
            outputAsModuleFolder: true
        })
    ]
```

> The source code for this package also uses the plugin, so this can be used as a demonstration ¯\\\_(ツ)\_/¯