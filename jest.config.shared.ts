import { defaults } from "jest-config";

const jestConfig = {
	...defaults,
	roots: ["<rootDir>/src/shared"],
	testMatch: ["**/?(*.)test.ts"],
	transform: {
		"^.+\\.ts$": ["@swc/jest"],
	},
	collectCoverage: true,
	coverageDirectory: "./coverage",
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
