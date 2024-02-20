import { defaults } from "jest-config";

const jestConfig = {
	...defaults,
	roots: ["<rootDir>/src/", "<rootDir>/tests/"],
	testMatch: ["**/unit/**/*.test.ts"],
	collectCoverage: false,
	testEnvironment: "node",
	preset: "ts-jest",
	transformIgnorePatterns: ["/node_modules/(?!(nanoid)/)"],
	extensionsToTreatAsEsm: [".ts", ".tsx"],
	setupFilesAfterEnv: ["<rootDir>/tests/jest.setup.js"],
	moduleNameMapper: {
		"^@/(.*)$": "<rootDir>/src/electron/future/$1",
		"^#/(.*)$": "<rootDir>/src/shared/$1",
	},
};

export default jestConfig;
