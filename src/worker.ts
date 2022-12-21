import { EntryPointConfig } from "dts-bundle-generator";
import { parentPort, workerData } from "node:worker_threads";
import { compile } from "./generator";
import type { Options } from "./options";

type WorkerData = {
    entries: EntryPointConfig[];
    options: Options;
};

const {
    entries,
    options,
}: WorkerData = workerData;

compile(entries, options).then(buffer => {
    parentPort?.postMessage(buffer);
});