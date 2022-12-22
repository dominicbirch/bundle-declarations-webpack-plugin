import type { JestConfigWithTsJest } from "ts-jest";


export default <JestConfigWithTsJest>{
	preset: "ts-jest/presets/default-esm",
	testEnvironment: "node",
	collectCoverageFrom: ['src/**/*.ts', '!**/*.d.ts'],
	coverageDirectory: "coverage",
	coverageReporters: [
		"cobertura",
		"clover",
		"lcov",
	],
	moduleDirectories: ['node_modules', 'src'],
	moduleNameMapper: {
		'^(\\.{1,2}/.*)\\.[tj]s$': '$1',
	},
	moduleFileExtensions: ["js", "ts"],
	extensionsToTreatAsEsm: [".ts"],
	transform: {
		'\\.ts$': [
			'ts-jest',
			{
				useESM: true,
				isolatedModules: true,
				tsconfig: "./tsconfig.json",
			},
		],
	},
};
