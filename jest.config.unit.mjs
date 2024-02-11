import { defaults } from "jest-config";

const jestConfig = {
	...defaults,
	roots: ["<rootDir>/main/", "<rootDir>/tests/"],
	testMatch: ["**/unit/**/*.test.ts"],
	collectCoverage: false,
	testEnvironment: "node",
	preset: "ts-jest",
	transformIgnorePatterns: ["/node_modules/(?!(nanoid)/)"],
	extensionsToTreatAsEsm: [".ts", ".tsx"],
	setupFilesAfterEnv: ["<rootDir>/tests/jest.setup.js"],
};

export default jestConfig;
