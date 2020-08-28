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
