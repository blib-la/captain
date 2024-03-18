import { existsSync } from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";

import { WINDOW_CLOSE_KEY, WINDOW_MAXIMIZE_KEY, WINDOW_MINIMIZE_KEY } from "@captn/utils/constants";
import { BrowserWindow, dialog, ipcMain } from "electron";
import { download } from "electron-dl";
import { v4 } from "uuid";

import { buildKey } from "#/build-key";
import { DownloadState, ID } from "#/enums";
import { getFileType } from "#/string";
import { apps } from "@/apps";
import { inventoryStore, downloadsStore } from "@/stores";
import { pushToStore } from "@/stores/utils";
import { getCaptainData, getCaptainDownloads, getDirectory } from "@/utils/path-helpers";
import { unpack } from "@/utils/unpack";

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
		const { dir: directory } = path.parse(filePath);
		const fileType = getFileType(filePath);

		// Ensure the directory exists, creating it if necessary
		if (!existsSync(directory)) {
			await fsp.mkdir(directory, { recursive: true });
		}

		// Write the file content
		await fsp.writeFile(filePath, content, options);
		const id = v4();
		const keyPath = `files.${fileType}`;
		// Update the application's file inventory
		const files = inventoryStore.get<string, { filePath: string; id: string }[]>(keyPath, []);
		files.push({ filePath, id });
		inventoryStore.set(keyPath, files);

		return { filePath, fileType };
	}
);

ipcMain.handle(
	buildKey([ID.FILE], { suffix: ":copy" }),
	async (_event, source: string, destination: string) => {
		const filePath = getCaptainData("files", destination);
		const { dir: directory } = path.parse(filePath);
		console.log("COPY FILE 1", { source, filePath });

		// Ensure the directory exists, creating it if necessary
		if (!existsSync(directory)) {
			await fsp.mkdir(directory, { recursive: true });
		}

		console.log("COPY FILE 2", { source, filePath });
		// Copy the file
		await fsp.copyFile(source, filePath);
	}
);

ipcMain.handle(
	buildKey([ID.FILE], { suffix: ":read" }),
	async (_event, name: string, encoding: BufferEncoding = "utf8") => fsp.readFile(name, encoding)
);

/**
 * Retrieves a value from the inventory store.
 * This IPC handler responds to requests for data retrieval from the inventory store,
 * returning the value associated with the specified key, or a default value if the key doesn't exist.
 *
 * @param {string} key - The key associated with the value to retrieve from the inventory store.
 * @param {unknown} defaultValue - A default value to return if the key is not found in the store.
 * @returns {unknown} The value from the inventory store or the default value if the key is not present.
 */
ipcMain.handle(
	buildKey([ID.STORE, ID.INVENTORY], { suffix: ":get" }),
	(_event, key: string, defaultValue: unknown) =>
		// Directly return the value obtained from the inventory store using the provided key.
		// If the key does not exist, the specified default value is returned.
		inventoryStore.get(key, defaultValue)
);

/**
 * Retrieves a value from the downloads store.
 * This IPC handler is invoked when the renderer process needs to check the status
 * or details of a download task based on its unique identifier.
 *
 * @param {string} key - The unique identifier for the download task to query in the downloads store.
 * @param {unknown} defaultValue - A default value to return if the unique identifier is not found.
 * @returns {unknown} The value from the downloads store or the default value if the identifier is not present.
 */
ipcMain.handle(
	buildKey([ID.STORE, ID.DOWNLOADS], { suffix: ":get" }),
	(_event, key: string, defaultValue: unknown) =>
		// Retrieve and return the value associated with the download task's unique identifier.
		// If the identifier isn't found, return the given default value.
		downloadsStore.get(key, defaultValue)
);

/**
 * Initiates multiple file download processes in sequence.
 * This function is bound to an IPC channel that listens for bulk download requests. Each request can contain
 * multiple download tasks, which are processed sequentially. For each download task, it sets up the download
 * parameters based on the provided data, initiates the download, and manages the download state through its lifecycle.
 * Additionally, it supports optional unzipping of downloaded files.
 *
 * @param {Object[]} data - An array of objects, each containing the necessary information for a download task, including:
 *                          - `label`: A descriptive label for the download task.
 *                          - `id`: A unique identifier for the download task, used for tracking and state management.
 *                          - `appId`: Identifier for the app requesting the download, used to route progress and completion messages.
 *                          - `source`: The URL from which the file will be downloaded.
 *                          - `destination`: The intended destination path for the downloaded file, relative to a base directory.
 *                          - `unzip`: Optional flag indicating whether the downloaded file should be automatically unzipped upon completion.
 * @returns {Promise<void>} A promise that resolves when all download tasks in the request have been processed.
 */

ipcMain.handle(
	buildKey([ID.FILE, ID.DOWNLOADS], { suffix: ":start" }),
	async (
		_event,
		data: {
			label: string;
			id: string;
			appId: string;
			source: string;
			destination: string;
			unzip?: boolean;
		}[]
	) => {
		// Set the initial state of the download to ACTIVE in the downloads store
		for (const item of data) {
			downloadsStore.set(item.id, DownloadState.ACTIVE);

			// Prompt is always open, therefore we can safely assert its existence with '!' and initiate the download.
			await download(apps.prompt!, item.source, {
				showProgressBar: true, // Option to show the download progress bar
				showBadge: true,
				overwrite: true,
				directory: getCaptainDownloads(),
				onProgress(progress) {
					console.log(progress);
					if (apps[item.appId]) {
						apps[item.appId]?.webContents.send("download", progress);
					}
				},
				async onCompleted(file) {
					const modelPath = getCaptainDownloads(item.destination, item.id);

					if (item.unzip) {
						// Unpack immediately and send to array to allow awaiting multiple unzips
						try {
							await unpack(
								getDirectory("7zip/win/7za.exe"),
								file.path,
								modelPath,
								true
							);
							downloadsStore.set(item.id, DownloadState.DONE);
							const keyPath = item.destination.replaceAll("/", ".");
							pushToStore(inventoryStore, keyPath, {
								id: item.id,
								modelPath,
								label: item.label,
							});
							if (apps[item.appId]) {
								apps[item.appId]?.webContents.send("downloadComplete", true);
							}
						} catch (error) {
							console.log(`Error on ${item.id}`, error);
							downloadsStore.set(item.id, DownloadState.FAILED);
						} finally {
							downloadsStore.delete(item.id);
						}
					}
				},
				onCancel() {
					downloadsStore.set(item.id, DownloadState.CANCELLED);
				},
			}).catch(() => {
				downloadsStore.set(item.id, DownloadState.FAILED);
			});
		}
	}
);
