import { existsSync } from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";

import { WINDOW_CLOSE_KEY, WINDOW_MAXIMIZE_KEY, WINDOW_MINIMIZE_KEY } from "@captn/utils/constants";
import { BrowserWindow, dialog, ipcMain } from "electron";

import { buildKey } from "#/build-key";
import { ID } from "#/enums";
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

ipcMain.handle(
	buildKey([ID.FILE], { suffix: ":write" }),
	async (
		_event,
		subpath: string,
		content: string,
		options: { encoding?: BufferEncoding } = {}
	) => {
		const filePath = getCaptainData("files", subpath);
		const directory = path.parse(filePath).dir;

		if (!existsSync(directory)) {
			await fsp.mkdir(directory, { recursive: true });
		}

		await fsp.writeFile(filePath, content, options);
		return filePath;
	}
);

ipcMain.handle(
	buildKey([ID.FILE], { suffix: ":read" }),
	async (_event, name: string, encoding: BufferEncoding = "utf8") => fsp.readFile(name, encoding)
);
