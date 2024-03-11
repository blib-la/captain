import { handleCaptainAction, performElementAction } from "../action";

import { buildKey } from "#/build-key";
import { ID } from "#/enums";
import type { VectorStoreResponse } from "#/types/vector-store";

jest.mock("#/build-key", () => ({
	buildKey: jest.fn(),
}));

describe("handleCaptainAction", () => {
	// Mocking window.ipc.send
	const mockSend = jest.fn();
	beforeAll(() => {
		// Ensure window.ipc exists
		global.window.ipc = { send: mockSend } as any;
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("should handle function actions correctly", () => {
		const response: VectorStoreResponse = {
			id: "1",
			score: 0.5,
			payload: {
				id: "testFunction",
				language: "en",
				action: "function",
				label: "Test Function",
			},
		};

		(buildKey as jest.Mock).mockReturnValue("functionKey");

		handleCaptainAction(response);

		expect(buildKey).toHaveBeenCalledWith([ID.CAPTAIN_ACTION]);
		expect(mockSend).toHaveBeenCalledWith("functionKey", {
			action: response.payload.action,
			payload: response.payload,
		});
	});

	it("should handle non-function actions correctly", () => {
		const response: VectorStoreResponse = {
			id: "2",
			score: 0.5,
			payload: {
				id: "testApp",
				language: "en",
				action: "open",
				label: "Test App",
			},
		};

		(buildKey as jest.Mock).mockReturnValue("appKey:open");

		handleCaptainAction(response);

		expect(buildKey).toHaveBeenCalledWith([ID.APP], { suffix: ":open" });
		expect(mockSend).toHaveBeenCalledWith("appKey:open", {
			appId: response.payload.id,
			action: response.payload.action,
		});
	});
});

describe("performElementAction", () => {
	// Setup a DOM element for testing
	beforeAll(() => {
		document.body.innerHTML = `<div data-captainid="test-element"></div>`;
	});

	it("executes the action on an element when found", () => {
		const mockAction = jest.fn();
		performElementAction("test-element", mockAction);
		expect(mockAction).toHaveBeenCalledTimes(1);
		expect(mockAction).toHaveBeenCalledWith(expect.any(HTMLElement));
	});

	it("does not execute the action when the element is not found", () => {
		const mockAction = jest.fn();
		performElementAction("nonexistent-element", mockAction);
		expect(mockAction).not.toHaveBeenCalled();
	});

	it("logs an error when the action function throws", () => {
		const mockAction = jest.fn().mockImplementation(() => {
			throw new Error("Test error");
		});
		const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

		performElementAction("test-element", mockAction);
		expect(consoleErrorSpy).toHaveBeenCalledWith(
			expect.stringContaining(
				"Error performing action on element with captainId=test-element:"
			),
			expect.any(Error)
		);

		// Clean up
		consoleErrorSpy.mockRestore();
	});
});