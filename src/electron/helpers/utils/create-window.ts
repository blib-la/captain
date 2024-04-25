import path from "path";

import type { BrowserWindowConstructorOptions, Rectangle } from "electron";
import { BrowserWindow, shell } from "electron";
import Store from "electron-store";

import { buildKey } from "#/build-key";
import { LOCAL_PROTOCOL } from "#/constants";
import { ID } from "#/enums";
import { getCaptainData } from "@/utils/path-helpers";
import { ensureVisibleOnSomeDisplay, getCurrentPosition } from "@/utils/window";

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
	const name = buildKey([ID.STORE, ID.WINDOW], { suffix: `--${windowName}` });
	const store = new Store<Rectangle>({ name, cwd: getCaptainData("windows") });
	const defaultSize = {
		width: options.width ?? 800,
		height: options.height ?? 600,
	};

	let state = {};

	// Function to restore the window state from the store or use default size.
	function restore(): Rectangle {
		return store.get(key, { x: 0, y: 0, ...defaultSize });
	}

	// Initialize the BrowserWindow with restored state and provided options.
	const window_ = new BrowserWindow({
		...state,
		...options,
		webPreferences: {
			preload: path.join(__dirname, "preload.js"),
			...options.webPreferences,
			nodeIntegration: false,
			contextIsolation: true,
		},
	});

	window_.webContents.setWindowOpenHandler(({ url }) => {
		if (url.startsWith(`${LOCAL_PROTOCOL}://`) || url.startsWith("app://")) {
			return { action: "allow" };
		}

		// Open url in a browser and prevent default
		shell.openExternal(url);
		return { action: "deny" };
	});

	// Ensure the window is visible on some display.
	state = ensureVisibleOnSomeDisplay(restore(), defaultSize);

	// Setup event listener to save the window state on close.
	window_.on("close", () => {
		if (!window_.isMinimized() && !window_.isMaximized()) {
			Object.assign(state, getCurrentPosition(window_));
		}

		store.set(key, state);
	});

	return window_;
}
