import { EntryPointConfig, generateDtsBundle } from "dts-bundle-generator";
import { EOL } from "node:os";
import type { Options } from "options";

const
    emptyExports = /^export\s+{\s*};?\s*$/gmi,
    relativeReExport = /^export\s+\*.*?\bfrom\s+"[\.~\/].*$/gmi,
    emptyLines = /^\s*?[\r\n]+/gmi;

export async function compile(entries: EntryPointConfig[], { compilationOptions, removeEmptyExports, removeEmptyLines, removeRelativeReExport }: Omit<Options, "entry">) {
    return new Promise<Buffer>((resolve, reject) => {
        try {
            const raw = generateDtsBundle(entries, compilationOptions)
                .flatMap(x => x.split(EOL));
            const dts = raw
                .filter(l =>
                    !(removeEmptyLines && emptyLines.test(l))
                    && !(removeEmptyExports && emptyExports.test(l))
                    && !(removeRelativeReExport && relativeReExport.test(l))
                )
                .join(EOL);

            resolve(Buffer.from(dts));
        } catch (err) {
            reject(err);
        }
    });
}
