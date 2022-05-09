import type { InitialOptionsTsJest } from "ts-jest";


export default <InitialOptionsTsJest>{
	preset: "ts-jest",
	testEnvironment: "node",
	coverageDirectory: "coverage",
	coverageReporters: [
		"cobertura",
		"clover",
		"lcov",
	]
};
