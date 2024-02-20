import { BrowserWindow, ipcMain } from "electron";
import { download } from "electron-dl";

import { buildKey } from "#/build-key";
import { DownloadState, ID } from "#/enums";
import { getCaptainData, getCaptainDownloads, getDirectory } from "@/old-utils";
import { appSettingsStore, userStore } from "@/stores";
import { unpack } from "@/utils/unpack";

ipcMain.on(buildKey([ID.WINDOW], { suffix: ":close" }), () => {
	const window_ = BrowserWindow.getFocusedWindow();
	if (window_) {
		window_.close();
	}
});

ipcMain.on(buildKey([ID.WINDOW], { suffix: ":minimize" }), () => {
	const window_ = BrowserWindow.getFocusedWindow();
	if (window_) {
		window_.minimize();
	}
});

ipcMain.on(buildKey([ID.WINDOW], { suffix: ":maximize" }), () => {
	const window_ = BrowserWindow.getFocusedWindow();
	if (!window_) {
		return;
	}

	if (window_.isMaximized()) {
		window_.unmaximize();
	} else {
		window_.maximize();
	}
});

ipcMain.on(buildKey([ID.INSTALL], { suffix: "start" }), async () => {
	const window_ = BrowserWindow.getFocusedWindow();
	if (!window_) {
		return;
	}

	const pythonEmbedded =
		"https://blibla-captain-assets.s3.eu-central-1.amazonaws.com/python-embedded-win.7z";

	try {
		await download(window_, pythonEmbedded, {
			directory: getCaptainDownloads(),

			onStarted() {
				appSettingsStore.set("status", DownloadState.ACTIVE);
				window_.webContents.send(buildKey([ID.INSTALL], { suffix: ":started" }), true);
			},
			onProgress(progress) {
				window_.webContents.send(buildKey([ID.INSTALL], { suffix: ":progress" }), progress);
			},
			onCancel() {
				window_.webContents.send(buildKey([ID.INSTALL], { suffix: ":cancelled" }), true);
				appSettingsStore.set("status", DownloadState.CANCELLED);
			},
			async onCompleted(item) {
				window_.webContents.send(buildKey([ID.INSTALL], { suffix: ":unpacking" }), true);

				const targetPath = getCaptainData("python-embedded");
				await unpack(getDirectory("7zip", "win", "7za.exe"), item.path, targetPath);

				window_.webContents.send(buildKey([ID.INSTALL], { suffix: ":completed" }), true);
				appSettingsStore.set("status", DownloadState.DONE);
			},
		});
	} catch (error) {
		if (error instanceof Error) {
			window_.webContents.send(buildKey([ID.INSTALL], { suffix: ":failed" }), error.message);
			appSettingsStore.set("status", DownloadState.FAILED);
		}
	}
});

ipcMain.on(buildKey([ID.USER], { suffix: ":language" }), (_event, language) => {
	userStore.set("language", language);
});
