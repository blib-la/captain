import Seven from "node-7z";

import { unpack } from "@/utils/unpack";

jest.mock("node-7z", () => ({
	extractFull: jest.fn().mockImplementation(() => ({
		on: jest.fn().mockImplementation((event, handler) => {
			if (event === "end") {
				process.nextTick(handler);
			}
		}),
	})),
}));

describe("electron/utils/unpack.ts", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("should successfully extract a file", async () => {
		await unpack("/mock/path/to/7za.exe", "mockSource.7z", "mockDestination");

		expect(Seven.extractFull).toHaveBeenCalledWith("mockSource.7z", "mockDestination", {
			$bin: "/mock/path/to/7za.exe",
		});
	});

	it("should throw an error when extraction fails", async () => {
		// Simulate an error
		(Seven.extractFull as jest.Mock).mockReturnValueOnce({
			on: jest.fn().mockImplementation((event, handler) => {
				if (event === "error") {
					process.nextTick(() => handler(new Error("Extraction failed")));
				}

				return {};
			}),
		});

		await expect(
			unpack("/mock/path/to/7za.exe", "invalidSource.7z", "mockDestination")
		).rejects.toThrow("Extraction failed");

		expect(Seven.extractFull).toHaveBeenCalledWith("invalidSource.7z", "mockDestination", {
			$bin: "/mock/path/to/7za.exe",
		});
	});
});
