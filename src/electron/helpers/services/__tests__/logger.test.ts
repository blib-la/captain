import { logError, logger } from "../logger";

import { jsonStringify } from "#/object";

// Mock the logger to prevent actual logging during tests
jest.mock("electron-log/node", () => ({
	transports: {
		file: {
			level: jest.fn(),
		},
		console: {
			format: jest.fn(),
		},
	},
	error: jest.fn(),
}));

jest.mock("#/object", () => ({
	jsonStringify: jest.fn(() => "mocked json"),
}));

describe("logError", () => {
	it("logs Error instances correctly", () => {
		const error = new Error("Test error");
		logError(error, "Error:");
		expect(logger.error).toHaveBeenCalledWith("Error:", error.message, error.stack);
	});

	it("logs plain objects correctly", () => {
		const error = { key: "value" };
		logError(error, "Object Error:");
		expect(jsonStringify).toHaveBeenCalledWith(error);
		expect(logger.error).toHaveBeenCalledWith("Object Error:", "mocked json");
	});

	it("logs non-object, non-Error values correctly", () => {
		const error = "A string error";
		logError(error, "String Error:");
		expect(logger.error).toHaveBeenCalledWith("String Error:", error);
	});
});
