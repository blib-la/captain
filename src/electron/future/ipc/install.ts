import { BrowserWindow, ipcMain } from "electron";
import { download } from "electron-dl";

import { buildKey } from "#/build-key";
import { DownloadState, ID } from "#/enums";
import { appSettingsStore } from "@/stores";
import { getCaptainData, getCaptainDownloads, getDirectory } from "@/utils/path-helpers";
import { unpack } from "@/utils/unpack";

ipcMain.on(buildKey([ID.INSTALL], { suffix: ":start" }), async (_event, data) => {
	const window_ = BrowserWindow.getFocusedWindow();
	if (!window_) {
		return;
	}

	try {
		// Iterate over each download object
		for (const { url, destination } of data) {
			await download(window_, url, {
				directory: getCaptainDownloads(),

				onStarted() {
					appSettingsStore.set("status", DownloadState.ACTIVE);
					window_.webContents.send(buildKey([ID.INSTALL], { suffix: ":started" }), true);
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
				async onCompleted(item) {
					window_.webContents.send(
						buildKey([ID.INSTALL], { suffix: ":unpacking" }),
						true
					);
					appSettingsStore.set("status", DownloadState.UNPACKING);

					const targetPath = getCaptainData(destination);
					await unpack(getDirectory("7zip", "win", "7za.exe"), item.path, targetPath);
				},
			});
		}

		// Everything was downloaded & unpacked
		window_.webContents.send(buildKey([ID.INSTALL], { suffix: ":completed" }), true);
		appSettingsStore.set("status", DownloadState.DONE);
	} catch (error) {
		if (error instanceof Error) {
			window_.webContents.send(buildKey([ID.INSTALL], { suffix: ":failed" }), error.message);
			appSettingsStore.set("status", DownloadState.FAILED);
		}
	}
});
