import { defaults } from "jest-config";

const jestConfig = {
	...defaults,
	roots: ["<rootDir>/../src/electron"],
	testMatch: ["**/?(*.)test.ts"],
	testPathIgnorePatterns: [".e2e."],
	transform: {
		"^.+\\.(ts|js)$": ["@swc/jest"],
	},
	moduleNameMapper: {
		"@/electron/(.*)": "<rootDir>/../src/electron/helpers/$1",
		"@/shared/(.*)": "<rootDir>/../src/shared/$1",
		"~package": "<rootDir>/../package.json",
	},
	collectCoverage: true,
	coverageDirectory: "./coverage/electron",
	coverageProvider: "v8",
	coverageReporters: ["lcov", "text", "json"],
	coverageThreshold: {
		global: {
			lines: 80,
		},
	},
	transformIgnorePatterns: ["/node_modules/.+\\.(?!c?js|mjs$)[^.]+$"],
	extensionsToTreatAsEsm: [".ts"],
	setupFilesAfterEnv: ["<rootDir>/jest.setup.electron.ts"],
};

export default jestConfig;
