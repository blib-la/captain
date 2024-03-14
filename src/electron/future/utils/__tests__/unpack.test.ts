import { unlink } from "node:fs/promises";

import Seven from "node-7z";

jest.mock("node-7z", () => ({
	extractFull: jest.fn().mockImplementation(() => ({
		on: jest.fn().mockImplementation((event, handler) => {
			if (event === "end") {
				process.nextTick(handler);
			} else if (event === "error") {
				// No default error simulation to allow for custom error tests
			}
		}),
	})),
}));

jest.mock("node:fs/promises", () => ({
	unlink: jest.fn().mockImplementation(() => Promise.resolve()),
}));

import { unpack } from "@/utils/unpack";

describe("electron/utils/unpack.ts", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		(unlink as jest.Mock).mockImplementation(() => Promise.resolve());
	});

	it("should successfully extract a file", async () => {
		await unpack("/mock/path/to/7za.exe", "mockSource.7z", "mockDestination");

		expect(Seven.extractFull).toHaveBeenCalledWith("mockSource.7z", "mockDestination", {
			$bin: "/mock/path/to/7za.exe",
		});

		expect(unlink).not.toHaveBeenCalled();
	});

	it("should delete the archive after unpacking when deleteAfterUnpack is true", async () => {
		await unpack("/mock/path/to/7za.exe", "mockSource.7z", "mockDestination", true);

		expect(Seven.extractFull).toHaveBeenCalledWith("mockSource.7z", "mockDestination", {
			$bin: "/mock/path/to/7za.exe",
		});
		expect(unlink).toHaveBeenCalledWith("mockSource.7z");
	});

	it("should throw an error when extraction fails", async () => {
		// Simulate an error
		(Seven.extractFull as jest.Mock).mockReturnValueOnce({
			on: jest.fn().mockImplementation((event, handler) => {
				if (event === "error") {
					process.nextTick(() => handler(new Error("Extraction failed")));
				}
			}),
		});

		await expect(
			unpack("/mock/path/to/7za.exe", "invalidSource.7z", "mockDestination")
		).rejects.toThrow("Extraction failed");

		expect(Seven.extractFull).toHaveBeenCalledWith("invalidSource.7z", "mockDestination", {
			$bin: "/mock/path/to/7za.exe",
		});
		expect(unlink).not.toHaveBeenCalled();
	});

	it("should throw an error when unlinking fails after successful extraction", async () => {
		// Mock unlink to reject with an error for this test
		(unlink as jest.Mock).mockImplementationOnce(() =>
			Promise.reject(new Error("Unlinking failed"))
		);

		// Since the extraction is successful, we simulate the end event
		(Seven.extractFull as jest.Mock).mockReturnValueOnce({
			on: jest.fn().mockImplementation((event, handler) => {
				if (event === "end") {
					process.nextTick(handler);
				}
			}),
		});

		// Expect the unpack function to reject with the unlink error
		await expect(
			unpack("/mock/path/to/7za.exe", "mockSource.7z", "mockDestination", true)
		).rejects.toThrow("Unlinking failed");

		expect(Seven.extractFull).toHaveBeenCalledWith("mockSource.7z", "mockDestination", {
			$bin: "/mock/path/to/7za.exe",
		});

		// Check that unlink was called despite the error
		expect(unlink).toHaveBeenCalledWith("mockSource.7z");
	});
});
