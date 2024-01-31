import type { BrowserWindowConstructorOptions, Rectangle } from "electron";
import { BrowserWindow, dialog, ipcMain } from "electron";
import Store from "electron-store";

import { CAPTION_RUNNING, DIRECTORY, DOWNLOADS } from "./constants";
import { store as userStore } from "./store";
import { ensureVisibleOnSomeDisplay, getCurrentPosition } from "./utils";

/**
 * Creates a new Electron BrowserWindow with specified options.
 * Manages window state using `electron-store` to remember its size and position.
 * Sets up IPC handler for opening directory dialogs.
 *
 * @param {string} windowName - The name of the window, used for state persistence.
 * @param {BrowserWindowConstructorOptions} options - Options for the BrowserWindow.
 * @returns {Promise<BrowserWindow>} A promise that resolves to the created BrowserWindow instance.
 */
export async function createWindow(
	windowName: string,
	options: BrowserWindowConstructorOptions
): Promise<BrowserWindow> {
	// Define key and name for window state storage.
	const key = "window-state";
	const name = `window-state-${windowName}`;
	const store = new Store<Rectangle>({ name });
	const defaultSize = {
		width: options.width ?? 900,
		height: options.height ?? 600,
	};

	let state = {};

	// Function to restore the window state from the store or use default size.
	function restore(): Rectangle {
		return store.get(key, { x: 0, y: 0, ...defaultSize });
	}

	// Initialize the BrowserWindow with restored state and provided options.
	const win = new BrowserWindow({
		...state,
		...options,
		webPreferences: {
			nodeIntegration: false,
			contextIsolation: true,
			...options.webPreferences,
		},
	});

	// Ensure the window is visible on some display.
	state = ensureVisibleOnSomeDisplay(restore(), defaultSize);

	// Setup event listener to save the window state on close.
	win.on("close", () => {
		if (!win.isMinimized() && !win.isMaximized()) {
			Object.assign(state, getCurrentPosition(win));
		}

		store.set(key, state);
		// Set the caption running flag to false, since all services will be aborted when the app is closed
		userStore.delete(CAPTION_RUNNING);
		userStore.delete(DOWNLOADS);
	});

	// Setup IPC handler to open directory dialog and return the selected path.
	ipcMain.handle(`${DIRECTORY}:get`, async () => {
		const { canceled, filePaths } = await dialog.showOpenDialog(win, {
			properties: ["openDirectory"],
		});
		if (canceled) {
			return;
		}

		return filePaths[0];
	});

	return win;
}
