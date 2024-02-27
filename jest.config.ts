import { defaults } from "jest-config";

const jestConfig = {
	...defaults,
	testMatch: ["**/?(*.)test.ts?(x)"],
	testPathIgnorePatterns: [".e2e."],
	transform: {
		"^.+\\.(t|j)sx?$": [
			"@swc/jest",
			{
				jsc: {
					transform: {
						react: {
							runtime: "automatic",
						},
					},
				},
			},
		],
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
	testEnvironment: "jsdom",
	transformIgnorePatterns: ["/node_modules/"],
	extensionsToTreatAsEsm: [".ts", ".tsx"],
};

export default jestConfig;
