import { defaults } from "jest-config";

const jestConfig = {
	...defaults,
	roots: ["<rootDir>/../src/shared"],
	testMatch: ["**/?(*.)test.ts"],
	transform: {
		"^.+\\.ts$": ["@swc/jest"],
	},
	moduleNameMapper: {
		"@/shared/(.*)": "<rootDir>/../src/shared/$1",
		"~package": "<rootDir>/../package.json",
	},
	collectCoverage: true,
	coverageDirectory: "./coverage/shared",
	coverageProvider: "v8",
	coverageReporters: ["lcov", "text", "json"],
	coverageThreshold: {
		global: {
			lines: 80,
		},
	},
	transformIgnorePatterns: ["/node_modules/"],
	extensionsToTreatAsEsm: [".ts"],
};

export default jestConfig;
