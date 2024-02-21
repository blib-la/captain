import { defaults } from "jest-config";

// Adjust the import path to your tsconfig.json file

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
	moduleNameMapper: {
		"@/(.*)": "<rootDir>/src/client/$1",
		"$/(.*)": "<rootDir>/src/electron/future/$1",
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
	testEnvironment: "jsdom",
	transformIgnorePatterns: ["/node_modules/"],
	extensionsToTreatAsEsm: [".ts", ".tsx"],
	setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
};

export default jestConfig;
