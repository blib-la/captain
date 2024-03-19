import { download } from "electron-dl";

import { DownloadEvent, DownloadState } from "./enums";
import type { DownloadItem } from "./types";

import { apps } from "@/apps";
import { getCaptainDownloads, getDirectory } from "@/utils/path-helpers";
import { unpack } from "@/utils/unpack";

export class DownloadManager {
	private static instance: DownloadManager | null;
	private downloadQueue: Array<DownloadItem>;
	private currentDownloads = 0;
	private maxConcurrentDownloads = 1;

	constructor() {
		this.downloadQueue = [];
	}

	public static getInstance(): DownloadManager {
		DownloadManager.instance ||= new DownloadManager();

		return DownloadManager.instance;
	}

	public static resetInstance(): void {
		DownloadManager.instance = null;
	}

	public getQueueSize() {
		return this.downloadQueue.length;
	}

	public getDownloadQueue() {
		return this.downloadQueue;
	}

	public isItemInQueue(itemId: string): boolean {
		return [...this.downloadQueue].some(item => item.id === itemId);
	}

	public addToQueue(item: DownloadItem): void {
		item.state = DownloadState.WAITING;
		const isDuplicate = this.downloadQueue.some(existingItem => existingItem.id === item.id);
		if (!isDuplicate) {
			this.downloadQueue.push(item);
			this.processQueue();
		}
	}

	private async processQueue(): Promise<void> {
		// If there's already the maximum number of downloads in progress, do nothing
		if (this.currentDownloads >= this.maxConcurrentDownloads) {
			return;
		}

		const queue = [...this.downloadQueue].sort(
			(a, b) => (a.createdAt || 0) - (b.createdAt || 0)
		);
		const nextItem = queue.find(item => item.state === DownloadState.WAITING);
		if (!nextItem) {
			console.log("No more items to process");
			return;
		}

		try {
			await this.startDownload(nextItem);
		} catch (error) {
			console.log(error);
			nextItem.state = DownloadState.ERROR;
			apps.core?.webContents.send(DownloadEvent.ERROR, nextItem.id, error);
		}
	}

	private async startDownload(item: DownloadItem): Promise<void> {
		// Prompt is our always open window, so we can use it for the download
		const window_ = apps.prompt!;
		try {
			await download(window_, item.source, {
				overwrite: true,
				showBadge: true,
				showProgressBar: true,
				directory: item.destination,
				onStarted: () => {
					this.currentDownloads += 1;

					item.state = DownloadState.STARTED;
					apps.core?.webContents.send(DownloadEvent.STARTED, item.id);
				},
				onCancel: () => {
					item.state = DownloadState.CANCELLED;
					apps.core?.webContents.send(DownloadEvent.CANCELLED, item.id);
					this.processQueue();
				},
				onCompleted: async file => {
					item.state = DownloadState.COMPLETED;
					this.currentDownloads -= 1;
					this.downloadQueue = this.downloadQueue.filter(
						queueItem => queueItem.id !== item.id
					);

					console.log(this.downloadQueue.length, file.path);

					// Check if more downloads can be started
					await this.processQueue();
					if (item.unzip) {
						try {
							await unpack(
								// Location of 7zip
								getDirectory("7zip/win/7za.exe"),
								file.path,
								// Location of folder where downloads are stored when done
								getCaptainDownloads(item.destination, item.id),
								true
							);
							apps.core?.webContents.send(DownloadEvent.COMPLETED, item.id);
						} catch (error) {
							apps.core?.webContents.send(DownloadEvent.ERROR, item.id, error);
						}
					} else {
						apps.core?.webContents.send(DownloadEvent.COMPLETED, item.id);
					}
				},
				onProgress({ percent, transferredBytes, totalBytes }) {
					apps.core?.webContents.send(DownloadEvent.PROGRESS, item.id, {
						percent,
						transferredBytes,
						totalBytes,
					});
				},
			});
		} catch (error) {
			console.log(error);
			item.state = DownloadState.ERROR;
			apps.core?.webContents.send(DownloadEvent.ERROR, item.id, error);
			this.processQueue();
		}
	}
}
