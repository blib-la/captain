import { defaults } from "jest-config";

const jestConfig = {
	...defaults,
	roots: ["<rootDir>/src/electron"],
	testMatch: ["**/*.test.e2e.ts"],
	transform: {
		"^.+\\.(ts)$": ["@swc/jest"],
		"^.+\\.(js)$": [
			"@swc/jest",
			{
				jsc: {
					target: "es5",
				},
			},
		],
	},
	moduleNameMapper: {
		"@/(.*)": "<rootDir>/src/electron/helpers/$1",
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
