import type { DownloadItem } from "@captn/utils/constants";
import { DOWNLOADS_MESSAGE_KEY, DownloadEvent, DownloadState } from "@captn/utils/constants";
import { download } from "electron-dl";

import { apps } from "@/apps";
import { inventoryStore } from "@/stores";
import { pushToStore } from "@/stores/utils";
import { sendToAllWindows } from "@/stores/watchers";
import { getCaptainDownloads, getCaptainTemporary, getDirectory } from "@/utils/path-helpers";
import { unpack } from "@/utils/unpack";

/**
 * The DownloadManager class serves as a centralized manager for handling all download-related activities within an application.
 * It is designed to manage a queue of downloads, allowing for operations such as adding to the queue, checking the queue's status,
 * and processing downloads in a controlled manner. This class employs a singleton pattern to ensure that only one instance manages
 * the download operations throughout the application lifecycle, thereby preventing conflicts and ensuring consistency in download management.
 *
 * The DownloadManager encapsulates the complexity of download operations, providing a simple and thread-safe interface for queuing and
 * managing downloads. It supports basic queue operations such as adding items to the queue and checking if an item exists within the queue.
 * Additionally, it implements logic to manage concurrent downloads, adhering to a specified limit of concurrent download operations to
 * avoid overwhelming the system or the network connection.
 *
 * This class utilizes events to communicate the progress and completion of downloads, making it easy to integrate with UI components or
 * other parts of the application that require updates on download status. It leverages the electron-dl library for performing the actual
 * download operations, encapsulating the library's functionality and providing a simplified interface for download tasks.
 *
 * Key functionalities include:
 * - Singleton access to ensure a single point of download management.
 * - Queue management to add, check, and process download items.
 * - Limitation of concurrent downloads to prevent overloading.
 * - Integration with electron-dl for handling download tasks, including support for progress tracking and cancellation.
 * - Event-driven updates for download progress, completion, and errors, facilitating easy integration with other application components.
 *
 * Usage of this class should be done through the getInstance method to access the singleton instance, ensuring that download operations
 * are centrally managed. The class provides methods to manipulate the download queue, including adding new downloads and querying the queue status.
 * It automatically handles the processing of queued downloads, respecting the maximum concurrent downloads limit and updating the status of each download accordingly.
 */
export class DownloadManager {
	private static instance: DownloadManager | null;
	private downloadQueue: Array<DownloadItem>;
	private currentDownloads = 0;
	private maxConcurrentDownloads = 1;

	/**
	 * Constructs a new instance of the DownloadManager class.
	 */
	constructor() {
		this.downloadQueue = [];
	}

	/**
	 * Retrieves the singleton instance of the DownloadManager.
	 * @returns The singleton instance of the DownloadManager.
	 */
	public static getInstance(): DownloadManager {
		DownloadManager.instance ||= new DownloadManager();

		return DownloadManager.instance;
	}

	/**
	 * Resets the singleton instance of the DownloadManager to null.
	 */
	public static resetInstance(): void {
		DownloadManager.instance = null;
	}

	/**
	 * Gets the current size of the download queue.
	 * @returns The number of items in the download queue.
	 */
	public getQueueSize() {
		return this.downloadQueue.length;
	}

	/**
	 * Retrieves the current download queue.
	 * @returns An array of DownloadItem objects in the queue.
	 */
	public getDownloadQueue() {
		return this.downloadQueue;
	}

	/**
	 * Checks if an item is already present in the download queue.
	 * @param itemId The unique identifier of the download item.
	 * @returns A boolean indicating whether the item is in the queue.
	 */
	public isItemInQueue(itemId: string): boolean {
		return [...this.downloadQueue].some(item => item.id === itemId);
	}

	/**
	 * Adds a new item to the download queue and processes the queue if possible.
	 * @param item The DownloadItem object to add to the queue.
	 */
	public addToQueue(item: DownloadItem): void {
		item.state = DownloadState.IDLE;
		const isDuplicate = this.downloadQueue.some(existingItem => existingItem.id === item.id);
		if (!isDuplicate) {
			this.downloadQueue.push(item);
			sendToAllWindows(DOWNLOADS_MESSAGE_KEY, {
				action: DownloadEvent.QUEUED,
				payload: item,
			});
			this.processQueue();
		}
	}

	/**
	 * Processes the next item in the download queue if the maximum concurrent downloads limit has not been reached.
	 * @private
	 */
	private async processQueue(): Promise<void> {
		// If there's already the maximum number of downloads in progress, do nothing
		if (this.currentDownloads >= this.maxConcurrentDownloads) {
			return;
		}

		const nextItem = this.downloadQueue.find(item => item.state === DownloadState.IDLE);
		if (!nextItem) {
			console.log("No more items to process");
			return;
		}

		console.log("DOWNLOAD STARTING", nextItem);
		this.currentDownloads += 1;
		await this.startDownload(nextItem);
	}

	/**
	 * Starts downloading an item, updating its state throughout the download process, and handling completion, progress, and errors.
	 * @param item The DownloadItem to be downloaded.
	 * @private
	 */
	private async startDownload(item: DownloadItem): Promise<void> {
		// Prompt is our always open window, so we can use it for the download
		const window_ = apps.prompt!;
		try {
			await download(window_, item.source, {
				overwrite: true,
				showBadge: true,
				showProgressBar: true,
				directory: item.unzip
					? getCaptainTemporary(item.destination, item.id)
					: getCaptainDownloads(item.destination, item.id),
				onStarted() {
					item.state = DownloadState.ACTIVE;
					sendToAllWindows(DOWNLOADS_MESSAGE_KEY, {
						action: DownloadEvent.STARTED,
						payload: item,
					});
				},
				onCompleted: async file => {
					item.state = DownloadState.DONE;
					this.currentDownloads -= 1;
					this.downloadQueue = this.downloadQueue.filter(
						queueItem => queueItem.id !== item.id
					);

					// Check if more downloads can be started
					this.processQueue();
					if (item.unzip) {
						try {
							item.state = DownloadState.UNPACKING;
							apps.core?.webContents.send(DOWNLOADS_MESSAGE_KEY, {
								action: DownloadEvent.UNPACKING,
								payload: item,
							});
							await unpack(
								getDirectory("7zip/win/7za.exe"),
								file.path,
								getCaptainDownloads(item.destination, item.id),
								true
							);
							item.state = DownloadState.DONE;
							sendToAllWindows(DOWNLOADS_MESSAGE_KEY, {
								action: DownloadEvent.COMPLETED,
								payload: item,
							});
							const modelPath = getCaptainDownloads(item.destination, item.id);
							const keyPath = item.destination.replaceAll("/", ".");
							pushToStore(inventoryStore, keyPath, {
								id: item.id,
								modelPath,
								label: item.label,
							});
						} catch {
							item.state = DownloadState.FAILED;
							this.currentDownloads -= 1;
							sendToAllWindows(DOWNLOADS_MESSAGE_KEY, {
								action: DownloadEvent.ERROR,
								payload: item,
							});
							this.processQueue();
						}
					} else {
						item.state = DownloadState.DONE;
						sendToAllWindows(DOWNLOADS_MESSAGE_KEY, {
							action: DownloadEvent.COMPLETED,
							payload: item,
						});
					}
				},
				onProgress({ percent, transferredBytes, totalBytes }) {
					item.state = DownloadState.ACTIVE;
					sendToAllWindows(DOWNLOADS_MESSAGE_KEY, {
						action: DownloadEvent.PROGRESS,
						payload: {
							...item,
							percent,
							transferredBytes,
							totalBytes,
						},
					});
				},
			});
		} catch {
			item.state = DownloadState.FAILED;
			this.currentDownloads -= 1;
			sendToAllWindows(DOWNLOADS_MESSAGE_KEY, {
				action: DownloadEvent.ERROR,
				payload: item,
			});
			this.processQueue();
		}
	}
}
