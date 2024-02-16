import { EntryPointConfig, generateDtsBundle } from "dts-bundle-generator";
import { EOL } from "node:os";
import type { Options } from "./options";

const
    emptyExports = /^export\s+{\s*};?\s*$/gmi,
    relativeReExport = /^export\s+\*.*?\bfrom\s+"[\.~\/].*$/gmi,
    emptyLines = /^\s*?[\r\n]+/gmi;

/** Generate the bundle content based on the options provided.
 * @param entries The typescript entrypoint details.
 * @param options The remaining configuration to be used.
 * @returns A buffer of the .d.ts file content.
 */
export function compile(entries: EntryPointConfig[], { compilationOptions, removeEmptyExports, removeEmptyLines, removeRelativeReExport }: Omit<Options, "entry" | "outFile">) {
    return new Promise<Buffer>((resolve, reject) => {
        try {
            const raw = generateDtsBundle(entries, compilationOptions)
                .flatMap(x => x.split("\n").map(y => y.trim()));
            const dts = raw
                .filter(l =>
                    !(removeEmptyLines && emptyLines.test(l))
                    && !(removeEmptyExports && emptyExports.test(l))
                    && !(removeRelativeReExport && relativeReExport.test(l))
                )
                .join("\n");

            resolve(Buffer.from(dts));
        } catch (err) {
            reject(err);
        }
    });
}
