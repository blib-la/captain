import { DOWNLOADS_MESSAGE_KEY } from "@captn/utils/constants";
import { ipcMain } from "electron";

import type { DownloadItem } from "#/types/download-manager";
import { DownloadManager } from "@/services/download-manager";

const downloadManager = new DownloadManager();
console.log({ DOWNLOADS_MESSAGE_KEY });

interface DownloadMessage {
	action: "download";
	payload: DownloadItem;
}
ipcMain.on(DOWNLOADS_MESSAGE_KEY, async (event, message: DownloadMessage) => {
	console.log(message);
	switch (message.action) {
		case "download": {
			downloadManager.addToQueue(message.payload);
			break;
		}

		default: {
			break;
		}
	}
});
