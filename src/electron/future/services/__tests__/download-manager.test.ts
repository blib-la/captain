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
		downloadManager.addToQueue(item);
		expect(downloadManager.getQueueSize()).toBe(1);
	});

	it("should process items in the queue in order and respect max concurrent downloads", async () => {
		(download as jest.Mock).mockImplementation(
			(_window, _url, options) =>
				new Promise<void>(resolve => {
					options.onStarted();
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

		expect(downloadManager.getQueueSize()).toBe(0);
	});

	it("should handle download errors correctly", async () => {
		(download as jest.Mock).mockImplementation(
			(_window, _url, options) =>
				new Promise<void>((_, reject) => {
					process.nextTick(() => {
						options.onStarted();
						const error = new Error("Download failed");
						reject(error);
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

		downloadManager.addToQueue(item);

		await new Promise(resolve => {
			setImmediate(resolve);
		});

		const updatedItem = downloadManager.getDownloadQueue().find(index => index.id === item.id);
		expect(updatedItem?.state).toBe(DownloadState.ERROR);

		expect(apps.core?.webContents.send).toHaveBeenCalledWith(
			DownloadEvent.ERROR,
			item.id,
			expect.any(Error)
		);
	});

	it("should accurately report the queue size at various stages", async () => {
		expect(downloadManager.getQueueSize()).toBe(0);

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

		const item: DownloadItem = {
			id: v4(),
			source: testDownloadFile,
			destination: "test/download-manager/item1",
			label: "Test File 1",
			createdAt: Date.now(),
			state: DownloadState.WAITING,
		};

		downloadManager.addToQueue(item);

		expect(downloadManager.getQueueSize()).toBe(1);

		await new Promise(resolve => {
			setImmediate(resolve);
		});

		expect(downloadManager.getQueueSize()).toBe(0);
	});

	it("should respect the maxConcurrentDownloads setting by processing downloads sequentially", async () => {
		let downloadsStarted = 0;

		(download as jest.Mock).mockImplementation(
			(_window, _url, options) =>
				new Promise<void>(resolve => {
					downloadsStarted++;
					options.onStarted();
					setTimeout(() => {
						options.onCompleted({ path: `test/path/${options.directory}` });
						resolve();
					}, 100);
				})
		);

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

		expect(downloadsStarted).toBe(1);

		await new Promise(resolve => {
			setTimeout(resolve, 150);
		});

		expect(downloadsStarted).toBe(2);

		await new Promise(resolve => {
			setTimeout(resolve, 500);
		});

		expect(downloadsStarted).toBe(items.length);
	});

	it("should correctly report download progress", async () => {
		const totalBytes = 5000;
		(download as jest.Mock).mockImplementation(
			(_window, _url, options) =>
				new Promise<void>(resolve => {
					options.onStarted();
					const totalProgress = 1;
					let progress = 0;
					const steps = 5;
					const intervalId = setInterval(() => {
						progress += totalProgress / steps;
						options.onProgress({
							percent: progress,
							transferredBytes: progress * (totalBytes / steps),
							totalBytes,
						});

						if (progress >= totalProgress) {
							clearInterval(intervalId);
							options.onCompleted({ path: `test/path/${options.directory}` });
							resolve();
						}
					}, 10);
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

		const spySend = jest.spyOn(apps.core!.webContents, "send");

		downloadManager.addToQueue(item);

		await new Promise(resolve => {
			setTimeout(resolve, 100);
		});

		expect(spySend).toHaveBeenCalledWith(DownloadEvent.PROGRESS, item.id, {
			percent: expect.any(Number),
			transferredBytes: expect.any(Number),
			totalBytes,
		});

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
			unzip: true,
		};

		downloadManager.addToQueue(item);

		await new Promise(resolve => {
			setImmediate(resolve);
		});

		expect(unpack).toHaveBeenCalledWith(
			expect.any(String),
			`test/path/success.zip`,
			expect.any(String),
			true
		);

		expect(apps.core?.webContents.send).toHaveBeenCalledWith(DownloadEvent.COMPLETED, item.id);
	});

	it("should handle errors during the unzip process", async () => {
		(unpack as jest.Mock).mockRejectedValueOnce(new Error("Unpack failed"));

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

		await new Promise(resolve => {
			setImmediate(resolve);
		});

		expect(apps.core?.webContents.send).toHaveBeenCalledWith(
			DownloadEvent.ERROR,
			item.id,
			expect.any(Error)
		);

		jest.clearAllMocks();
	});
});
