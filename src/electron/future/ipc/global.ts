import { existsSync } from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";

import { WINDOW_CLOSE_KEY, WINDOW_MAXIMIZE_KEY, WINDOW_MINIMIZE_KEY } from "@captn/utils/constants";
import { BrowserWindow, dialog, ipcMain } from "electron";

import { buildKey } from "#/build-key";
import { ID } from "#/enums";
import { getFileType } from "#/string";
import { inventoryStore } from "@/stores";
import { getCaptainData } from "@/utils/path-helpers";

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

ipcMain.handle(buildKey([ID.DIRECTORY], { prefix: "path:", suffix: ":get" }), async () => {
	const window_ = BrowserWindow.getFocusedWindow();
	if (window_) {
		const {
			canceled,
			filePaths: [filePath],
		} = await dialog.showOpenDialog(window_, {
			properties: ["openDirectory"],
		});
		if (canceled) {
			return;
		}

		return filePath;
	}
});

ipcMain.handle(buildKey([ID.FILE], { prefix: "path:", suffix: ":get" }), async () => {
	const window_ = BrowserWindow.getFocusedWindow();
	if (window_) {
		const {
			canceled,
			filePaths: [filePath],
		} = await dialog.showOpenDialog(window_, {
			properties: ["openFile"],
		});
		if (canceled) {
			return;
		}

		return filePath;
	}
});

/**
 * Handles an IPC event to write content to a file at a specified subpath within the application's data directory.
 * This handler determines the file's directory and type, ensures the directory exists (creating it if necessary),
 * writes the content to the file, and then records the file's path and type in the application's inventory store.
 *
 * @param {Electron.IpcMainInvokeEvent} _event - The IPC event object. Not used in this handler, but required by the Electron API.
 * @param {string} subpath - The subpath within the application's data directory where the file should be written.
 * @param {string} content - The content to write to the file.
 * @param {Object} [options={}] - Optional file writing options. Currently supports 'encoding'.
 * @returns {Promise<{filePath: string, fileType: string, url: string}>} A promise that resolves with the written file's path and type.
 *
 * @example
 * // Invoking this handler from a renderer process using Electron's IPC:
 * ipcRenderer.invoke(buildKey([ID.FILE], { suffix: ":write" }), 'notes/to-do.md', 'Complete the project documentation.', { encoding: 'utf8' })
 *   .then(({ filePath, fileType }) => console.log(`File written at ${filePath} as ${fileType}.`));
 */
// Assuming 'buildKey' and 'ID' are defined and accessible in this context
ipcMain.handle(
	buildKey([ID.FILE], { suffix: ":write" }),
	async (
		_event,
		subpath: string,
		content: string,
		options: {
			encoding?: BufferEncoding;
		} = {}
	) => {
		const filePath = getCaptainData("files", subpath);
		const { dir: directory, name } = path.parse(filePath);
		const fileType = getFileType(filePath);

		// Ensure the directory exists, creating it if necessary
		if (!existsSync(directory)) {
			await fsp.mkdir(directory, { recursive: true });
		}

		// Write the file content
		await fsp.writeFile(filePath, content, options);

		const keyPath = `files.${fileType}`;
		// Update the application's file inventory
		const files = inventoryStore.get<string, { filePath: string; id: string }[]>(keyPath, []);
		files.push({ filePath, id: name });
		inventoryStore.set(keyPath, files);

		return { filePath, fileType };
	}
);

ipcMain.handle(
	buildKey([ID.FILE], { suffix: ":read" }),
	async (_event, name: string, encoding: BufferEncoding = "utf8") => fsp.readFile(name, encoding)
);

ipcMain.handle(
	buildKey([ID.STORE, ID.INVENTORY], { suffix: ":get" }),
	(_event, key: string, defaultValue: unknown) => inventoryStore.get(key, defaultValue)
);
