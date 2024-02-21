import { defaults } from "jest-config";

// Adjust the import path to your tsconfig.json file

const jestConfig = {
	...defaults,
	roots: ["<rootDir>/src/electron"],
	testMatch: ["**/?(*.)test.ts"],
	testPathIgnorePatterns: [".e2e."],
	transform: {
		"^.+\\.ts$": ["@swc/jest"],
	},
	moduleNameMapper: {
		"@/(.*)": "<rootDir>/src/electron/future/$1",
		"#/(.*)": "<rootDir>/src/shared/$1",
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
	setupFilesAfterEnv: ["<rootDir>/jest.setup.electron.ts"],
};

export default jestConfig;
