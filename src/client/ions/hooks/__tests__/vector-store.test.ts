import { renderHook } from "@testing-library/react";
import { useDebounce } from "use-debounce";

import { useVectorStore } from "../vector-store";

import { buildKey } from "#/build-key";
import { ID } from "#/enums";

jest.mock("use-debounce", () => ({
	useDebounce: jest.fn(),
}));

describe("useVectorStore", () => {
	beforeEach(() => {
		// Mock the global window.ipc object
		global.window.ipc = {
			send: jest.fn(),
			on: jest.fn((eventKey, callback) => {
				if (eventKey.includes(":result")) {
					callback(/* Mock response data */);
				} else if (eventKey.includes(":error")) {
					callback(/* Mock error data */);
				}

				return () => {}; // Mock unsubscribe function
			}),
		} as any;

		jest.clearAllMocks();
	});

	it("sends the correct query when the debounced value changes", async () => {
		// Given
		const query = "test query";
		const options = { score_threshold: 0.5 };
		const expectedKey = buildKey([ID.VECTOR_STORE], { suffix: ":search" });
		(useDebounce as jest.Mock).mockReturnValue([query]);

		renderHook(() => useVectorStore(query, options));

		expect(window.ipc.send).toHaveBeenCalledWith(expectedKey, {
			query,
			options,
		});
	});
});
