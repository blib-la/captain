import fs from "node:fs";
import fsp from "node:fs/promises";

import type { BrowserWindow } from "electron";
import { download } from "electron-dl";
import { v4 } from "uuid";

import { DownloadManager } from "../download-manager";
import { DownloadEvent, DownloadState } from "../download-manager/enums"; // Adjust the import path based on your project structure
import type { DownloadItem } from "../download-manager/types";

import { apps } from "@/apps";
import { getCaptainDownloads } from "@/utils/path-helpers";
import { unpack } from "@/utils/unpack";

const testDownloadFile = "https://example.com/test.jpg";

jest.mock("electron-dl", () => {
	const originalModule = jest.requireActual("electron-dl");

	// Return the original module but override the download function
	return {
		...originalModule,
		download: jest.fn(),
	};
});

jest.mock("@/utils/unpack", () => ({
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	unpack: jest.fn().mockResolvedValue(),
}));

apps.prompt = {
	webContents: {
		send: jest.fn(),
	},
} as unknown as BrowserWindow;

apps.core = {
	webContents: {
		send: jest.fn(),
	},
} as unknown as BrowserWindow;

describe("DownloadManager", () => {
	let downloadManager: DownloadManager;

	beforeEach(async () => {
		jest.clearAllMocks(); // Resets the state of all mocks
		DownloadManager.resetInstance();
		downloadManager = DownloadManager.getInstance();
		const testDirectory = getCaptainDownloads("test");
		try {
			if (fs.existsSync(testDirectory)) {
				await fsp.rm(testDirectory, { recursive: true });
			}
		} catch (error) {
			console.log("Error cleaning up test directory before tests:", error);
		}
	});

	afterAll(async () => {
		const testDirectory = getCaptainDownloads("test");
		try {
			if (fs.existsSync(testDirectory)) {
				await fsp.rm(testDirectory, { recursive: true });
			}
		} catch (error) {
			console.log("Error cleaning up test directory after all tests:", error);
		}
	});
	it("should create a singleton instance", () => {
		const anotherInstance = DownloadManager.getInstance();
		expect(downloadManager).toBe(anotherInstance);
	});

	it("should add a download item to the queue", () => {
		const item: DownloadItem = {
			id: v4(),
			source: testDownloadFile,
			destination: "test/download-manager",
			label: "Test File",
			createdAt: Date.now(),
			state: DownloadState.WAITING,
		};

		downloadManager.addToQueue(item);
		// Assuming you make the queue accessible for testing or provide a method to check if an item is in the queue
		expect(downloadManager.isItemInQueue(item.id)).toBeTruthy();
	});

	it("should not add duplicate items to the queue", () => {
		const item: DownloadItem = {
			id: v4(),
			source: testDownloadFile,
			destination: "test/download-manager",
			label: "Test File",
			createdAt: Date.now(),
		};

		downloadManager.addToQueue(item);
		downloadManager.addToQueue(item); // Attempt to add the same item again
		expect(downloadManager.getQueueSize()).toBe(1); // You might need to implement getQueueSize()
	});

	it("should process items in the queue in order and respect max concurrent downloads", async () => {
		// Mock the download function to simulate immediate completion without using Jest's fake timers
		(download as jest.Mock).mockImplementation(
			(_window, _url, options) =>
				// Simulate immediate download start and completion
				new Promise<void>(resolve => {
					options.onStarted();
					// Immediately invoke onCompleted without any artificial delay
					process.nextTick(() => {
						options.onCompleted({ path: `test/path/${options.directory}` });
						resolve();
					});
				})
		);

		const items: DownloadItem[] = [1, 2, 3].map(index => ({
			id: v4(),
			source: testDownloadFile,
			destination: `test/download-manager/${index}`,
			label: `Test File ${index}`,
			createdAt: Date.now(),
			state: DownloadState.WAITING,
		}));

		// Add all items to the queue
		for (const item of items) {
			downloadManager.addToQueue(item);
		}

		// We need to ensure that the download manager has time to process all items.
		// Since the downloads are now mocked to complete immediately, we can wait for the
		// download manager to catch up by awaiting a small delay.
		// This delay is just to yield control back to the event loop to allow all pending
		// asynchronous operations (initiated by the mock) to complete.
		await new Promise(resolve => {
			setImmediate(resolve);
		});

		// Verify the queue is empty after all downloads have been processed
		expect(downloadManager.getQueueSize()).toBe(0);
	});

	it("should handle download errors correctly", async () => {
		// Mock the download function to simulate a failure
		(download as jest.Mock).mockImplementation(
			(_window, _url, options) =>
				new Promise<void>((_, reject) => {
					process.nextTick(() => {
						// Simulate invoking the onError callback
						options.onStarted();
						const error = new Error("Download failed");
						reject(error); // Simulate download error
					});
				})
		);

		const item: DownloadItem = {
			id: v4(),
			source: testDownloadFile,
			destination: "test/download-manager/fail",
			label: "Failing Download",
			createdAt: Date.now(),
			state: DownloadState.WAITING,
		};

		// Add the item that will fail to download to the queue
		downloadManager.addToQueue(item);

		// Wait a tick to allow the mock and the DownloadManager to process the failure
		await new Promise(resolve => {
			setImmediate(resolve);
		});

		// Verify that the item's state is updated to ERROR
		const updatedItem = downloadManager.getDownloadQueue().find(index => index.id === item.id);
		expect(updatedItem?.state).toBe(DownloadState.ERROR);

		// Verify that the error event was sent correctly
		expect(apps.core?.webContents.send).toHaveBeenCalledWith(
			DownloadEvent.ERROR,
			item.id,
			expect.any(Error)
		);
	});

	it("should accurately report the queue size at various stages", async () => {
		// Initially, the queue should be empty
		expect(downloadManager.getQueueSize()).toBe(0);

		// Mock the download function to simulate immediate completion
		(download as jest.Mock).mockImplementation(
			(_window, _url, options) =>
				new Promise<void>(resolve => {
					process.nextTick(() => {
						options.onStarted();
						options.onCompleted({ path: `test/path/${options.directory}` });
						resolve();
					});
				})
		);

		// Add a download item to the queue
		const item: DownloadItem = {
			id: v4(),
			source: testDownloadFile,
			destination: "test/download-manager/item1",
			label: "Test File 1",
			createdAt: Date.now(),
			state: DownloadState.WAITING,
		};

		downloadManager.addToQueue(item);

		// After adding the item, the queue size should be 1
		expect(downloadManager.getQueueSize()).toBe(1);

		// Wait for the download to complete
		await new Promise(resolve => {
			setImmediate(resolve);
		});

		// After the download completes, the queue size should be back to 0
		expect(downloadManager.getQueueSize()).toBe(0);
	});

	it("should respect the maxConcurrentDownloads setting by processing downloads sequentially", async () => {
		let downloadsStarted = 0;

		// Mock the download function to increment downloadsStarted without immediately completing
		(download as jest.Mock).mockImplementation(
			(_window, _url, options) =>
				new Promise<void>(resolve => {
					downloadsStarted++;
					options.onStarted();
					// Use setTimeout to simulate a short download duration
					setTimeout(() => {
						options.onCompleted({ path: `test/path/${options.directory}` });
						resolve();
					}, 100);
				})
		);

		// Add multiple download items to the queue
		const items: DownloadItem[] = [1, 2, 3].map(index => ({
			id: v4(),
			source: `${testDownloadFile}${index}`,
			destination: `test/download-manager/item${index}`,
			label: `Test File ${index}`,
			createdAt: Date.now(),
			state: DownloadState.WAITING,
		}));

		for (const item of items) {
			downloadManager.addToQueue(item);
		}

		// Initially, only 1 download should have started
		expect(downloadsStarted).toBe(1);

		// Simulate waiting for the first download to complete
		await new Promise(resolve => {
			setTimeout(resolve, 150);
		});

		// After the first download completes, the next one should have started
		expect(downloadsStarted).toBe(2);

		// Wait for all downloads to potentially start
		await new Promise(resolve => {
			setTimeout(resolve, 500);
		});

		// Verify that downloads do not exceed maxConcurrentDownloads
		expect(downloadsStarted).toBe(items.length);
	});

	it("should correctly report download progress", async () => {
		// Mock the download function to simulate download progress
		(download as jest.Mock).mockImplementation(
			(_window, _url, options) =>
				new Promise<void>(resolve => {
					options.onStarted();
					// Simulate download progress
					const totalProgress = 1;
					let progress = 0;
					const steps = 5;
					const totalBytes = 5000;
					const intervalId = setInterval(() => {
						progress += totalProgress / steps; // Increment the progress
						options.onProgress({
							percent: progress,
							transferredBytes: progress * (totalBytes / steps), // Example value
							totalBytes, // Example value
						});

						if (progress >= totalProgress) {
							clearInterval(intervalId);
							options.onCompleted({ path: `test/path/${options.directory}` });
							resolve();
						}
					}, 10); // Fast interval for test speed-up
				})
		);

		const item: DownloadItem = {
			id: v4(),
			source: testDownloadFile,
			destination: "test/download-manager/progress",
			label: "Progressive Download",
			createdAt: Date.now(),
			state: DownloadState.WAITING,
		};

		// Spy on the app's core webContents.send method to intercept progress events
		const spySend = jest.spyOn(apps.core!.webContents, "send");

		downloadManager.addToQueue(item);

		// Wait for the mocked download to "complete"
		await new Promise(resolve => {
			setTimeout(resolve, 100);
		});

		// Verify that the progress event was sent with expected values
		expect(spySend).toHaveBeenCalledWith(DownloadEvent.PROGRESS, item.id, {
			percent: expect.any(Number),
			transferredBytes: expect.any(Number),
			totalBytes: 5000, // Match this with the mocked totalBytes above
		});

		// Optionally, verify that the progress event was sent multiple times
		expect(spySend.mock.calls.some(call => call[0] === DownloadEvent.PROGRESS)).toBe(true);
		expect(
			spySend.mock.calls.filter(call => call[0] === DownloadEvent.PROGRESS).length
		).toBeGreaterThan(1);
	});

	it("should correctly handle the unzip process after download completion", async () => {
		(download as jest.Mock).mockImplementation((_window, _url, options) =>
			Promise.resolve().then(() => {
				options.onStarted();
				options.onCompleted({ path: `test/path/success.zip` });
			})
		);

		const item: DownloadItem = {
			id: v4(),
			source: "https://example.com/success.zip",
			destination: "test/download-manager/unzip",
			label: "Zip Download",
			createdAt: Date.now(),
			state: DownloadState.WAITING,
			unzip: true, // Flag indicating this item should be unzipped after download
		};

		downloadManager.addToQueue(item);

		// Allow the mock download and potential unpacking to be processed
		await new Promise(resolve => {
			setImmediate(resolve);
		});

		// Verify unpack was called with the correct arguments
		expect(unpack).toHaveBeenCalledWith(
			expect.any(String), // The path to the unpacking tool, which might vary
			`test/path/success.zip`, // The downloaded file path
			expect.any(String), // The destination directory, which might be derived in the method
			true // The expected value for the `deleteAfterUnpack` argument
		);

		// Verify that the COMPLETED event is sent after unpacking
		expect(apps.core?.webContents.send).toHaveBeenCalledWith(DownloadEvent.COMPLETED, item.id);
	});

	it("should handle errors during the unzip process", async () => {
		(unpack as jest.Mock).mockRejectedValueOnce(new Error("Unpack failed"));

		// Adjust the download mock to simulate a successful download
		(download as jest.Mock).mockImplementation((_window, _url, options) =>
			Promise.resolve().then(() => {
				options.onStarted();
				options.onCompleted({ path: `test/path/failure.zip` });
			})
		);

		const item: DownloadItem = {
			id: v4(),
			source: "https://example.com/failure.zip",
			destination: "test/download-manager/unzip-failure",
			label: "Failed Zip Download",
			createdAt: Date.now(),
			state: DownloadState.WAITING,
			unzip: true,
		};

		downloadManager.addToQueue(item);

		// Wait for the mock download and unpack operation to be processed
		await new Promise(resolve => {
			setImmediate(resolve);
		});

		// Verify that an error event was sent due to unpack failure
		expect(apps.core?.webContents.send).toHaveBeenCalledWith(
			DownloadEvent.ERROR,
			item.id,
			expect.any(Error)
		);

		// Ensure the 'unpack' mock is cleared if you are re-mocking in the same test suite
		jest.clearAllMocks();
	});
});
