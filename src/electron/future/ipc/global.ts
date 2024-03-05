import { WINDOW_CLOSE_KEY, WINDOW_MAXIMIZE_KEY, WINDOW_MINIMIZE_KEY } from "@captn/utils/constants";
import { BrowserWindow, ipcMain } from "electron";

ipcMain.on(WINDOW_CLOSE_KEY, () => {
	const window_ = BrowserWindow.getFocusedWindow();
	if (window_) {
		window_.close();
	}
});

ipcMain.on(WINDOW_MINIMIZE_KEY, () => {
	const window_ = BrowserWindow.getFocusedWindow();
	if (window_) {
		window_.minimize();
	}
});

ipcMain.on(WINDOW_MAXIMIZE_KEY, () => {
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
