import type { DownloadItem } from "@captn/utils/constants";
import { DOWNLOADS_MESSAGE_KEY } from "@captn/utils/constants";
import { ipcMain } from "electron";

import { apps } from "@/electron/apps";
import { DownloadManager } from "@/electron/services/download-manager";
import { logError } from "@/electron/services/logger";

const downloadManager = new DownloadManager();

interface DownloadMessage {
	action: "download";
	payload: DownloadItem;
}

interface DownloadQueueMessage {
	action: "getAll";
}

ipcMain.on(
	DOWNLOADS_MESSAGE_KEY,
	async (_event, message: DownloadMessage | DownloadQueueMessage) => {
		switch (message.action) {
			case "download": {
				downloadManager.addToQueue(message.payload);
				break;
			}

			default: {
				break;
			}
		}

		switch (message.action) {
			case "getAll": {
				try {
					const payload = downloadManager.getDownloadQueue();
					apps.core?.webContents.send(DOWNLOADS_MESSAGE_KEY, {
						action: "getAll",
						payload,
					});
				} catch (error) {
					logError(error);
				}

				break;
			}

			default: {
				break;
			}
		}
	}
);
