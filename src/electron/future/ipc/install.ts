import { BrowserWindow, ipcMain } from "electron";
import { download } from "electron-dl";

import { buildKey } from "#/build-key";
import { DownloadState, ID } from "#/enums";
import { appSettingsStore } from "@/stores";
import { getCaptainData, getCaptainDownloads, getDirectory } from "@/utils/path-helpers";
import { unpack } from "@/utils/unpack";
import { initialize, populateFromDocuments, reset } from "@/utils/vector-store";

ipcMain.on(
	buildKey([ID.INSTALL], { suffix: ":start" }),
	async (_event, data: { url: string; destination: string; unzip?: boolean }[]) => {
		const window_ = BrowserWindow.getFocusedWindow();
		if (!window_) {
			return;
		}

		try {
			// Iterate over each download object
			const items: Promise<void>[] = [];
			for (const { url, destination, unzip } of data) {
				await download(window_, url, {
					directory: getCaptainDownloads(),

					onStarted() {
						appSettingsStore.set("status", DownloadState.ACTIVE);
						window_.webContents.send(
							buildKey([ID.INSTALL], { suffix: ":started" }),
							true
						);
					},
					onProgress(progress) {
						window_.webContents.send(
							buildKey([ID.INSTALL], { suffix: ":progress" }),
							progress
						);
					},
					onCancel() {
						window_.webContents.send(
							buildKey([ID.INSTALL], { suffix: ":cancelled" }),
							true
						);
						appSettingsStore.set("status", DownloadState.CANCELLED);
					},
					async onCompleted(file) {
						const targetPath = getCaptainData(destination);

						if (unzip) {
							// Unpack immediately and send to array to allow awaiting multiple unzips
							items.push(
								unpack(
									getDirectory("7zip", "win", "7za.exe"),
									file.path,
									targetPath,
									true
								)
							);
						}
					},
				});
			}

			// Set the state to unpacking and wait until all items are unpacked and ready
			window_.webContents.send(buildKey([ID.INSTALL], { suffix: ":unpacking" }), true);
			appSettingsStore.set("status", DownloadState.UNPACKING);
			await Promise.all(items);

			// Everything was downloaded & unpacked
			window_.webContents.send(buildKey([ID.INSTALL], { suffix: ":completed" }), true);
			appSettingsStore.set("status", DownloadState.DONE);
		} catch (error) {
			if (error instanceof Error) {
				window_.webContents.send(
					buildKey([ID.INSTALL], { suffix: ":failed" }),
					error.message
				);
				appSettingsStore.set("status", DownloadState.FAILED);
			}
		}
	}
);

ipcMain.on(buildKey([ID.INSTALL], { suffix: ":initialize" }), async event => {
	try {
		// Start the vector store and fill it with data
		await initialize();
		await reset();
		await populateFromDocuments();

		event.sender.send(buildKey([ID.INSTALL], { suffix: ":initialized" }), true);
	} catch (error) {
		event.sender.send(buildKey([ID.INSTALL], { suffix: ":error" }), error);
	}
});
