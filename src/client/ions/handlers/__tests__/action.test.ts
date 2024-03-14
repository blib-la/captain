import { handleCaptainAction } from "../action";

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
