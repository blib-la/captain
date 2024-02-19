import { BrowserWindow, ipcMain } from "electron";
import { download } from "electron-dl";

import { buildKey } from "#/build-key";
import { DownloadState, ID } from "#/enums";
import { appSettingsStore, userStore } from "@/stores";

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
		"https://huggingface.co/llava-hf/llava-1.5-7b-hf/resolve/main/model-00001-of-00003.safetensors?download=true";

	try {
		await download(window_, pythonEmbedded, {
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
			onCompleted() {
				window_.webContents.send(buildKey([ID.INSTALL], { suffix: ":completed" }), true);
				appSettingsStore.set("status", DownloadState.DONE);
			},
		});
	} catch (error) {
		if (error instanceof Error) {
			appSettingsStore.set("status", DownloadState.FAILED);
		}
	}
});

ipcMain.on(buildKey([ID.USER], { suffix: ":language" }), (_event, language) => {
	userStore.set("language", language);
});
