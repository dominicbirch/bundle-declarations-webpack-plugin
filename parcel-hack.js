import {renameSync, readFileSync, writeFileSync} from 'node:fs';

const cjs = readFileSync('./dist/index.cjs').toString();
const [worker] = /(?<=new URL\(["'])worker\.\w+(?=\.js)/i.exec(cjs) || [];

if (worker) {
	renameSync(`./dist/${worker}.js`, `./dist/${worker}.cjs`);
	writeFileSync('./dist/index.cjs', cjs.replace(/(?<=new URL\(["']worker\.\w+\.)js/i, 'cjs'));

	console.info(`Renamed './dist/${worker}.js' to './dist/${worker}.cjs'`);
}
