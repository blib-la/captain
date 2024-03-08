import { defaults } from "jest-config";

const jestConfig = {
	...defaults,
	roots: ["<rootDir>/src/electron"],
	testMatch: ["**/e2e/**/*.test.ts"],
	transform: {
		"^.+\\.(ts|js)$": ["@swc/jest"],
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
	transformIgnorePatterns: ["/node_modules/.+\\.(?!c?js|mjs$)[^.]+$"],
	extensionsToTreatAsEsm: [".ts"],
};

export default jestConfig;
