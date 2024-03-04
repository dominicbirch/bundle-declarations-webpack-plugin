import { EntryPointConfig } from "dts-bundle-generator";
import { parentPort, workerData } from "node:worker_threads";
import { compile } from "./generator";
import type { Options } from "./options";

type WorkerData = {
    entries: EntryPointConfig[];
    options: Options;
};

try {
    const {
        entries,
        options,
    }: WorkerData = workerData;

    const buffer = await compile(entries, options)
    parentPort?.postMessage(buffer);
} catch (error) {
    console.error(error);

    throw error;
}