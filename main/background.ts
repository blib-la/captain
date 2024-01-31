import { exec } from "child_process";
import fsp from "fs/promises";
import path from "path";
import util from "util";

import { app, Menu, protocol, shell } from "electron";
import serve from "electron-serve";

import i18next from "../next-i18next.config.js";

import { createWindow } from "./helpers";
import {
	CAPTION_RUNNING,
	DOWNLOADS,
	LOCALE,
	MARKETPLACE_INDEX,
	MARKETPLACE_INDEX_DATA,
} from "./helpers/constants";
import { createJsonStructure } from "./helpers/read-index";
import { store as userStore } from "./helpers/store";
import { captainDataPath } from "./helpers/utils";
const execAsync = util.promisify(exec);

const isProduction = process.env.NODE_ENV === "production";
app.commandLine.appendSwitch("enable-smooth-scrolling");

if (isProduction) {
	serve({ directory: "app" });
} else {
	app.setPath("userData", `${app.getPath("userData")} (development)`);
}

const protocolName = "my";
protocol.registerSchemesAsPrivileged([{ scheme: protocolName, privileges: { bypassCSP: true } }]);

async function removeCaptainData(path_: string) {
	const directoryPath = path.join(captainDataPath, path_);

	try {
		await fsp.rm(directoryPath, { recursive: true });
	} catch (error) {
		console.error("Error removing directory:", error);
	}
}

export async function createMarketplace() {
	const marketplaceIndex = (userStore.get(MARKETPLACE_INDEX) ||
		"git@github.com:blib-la/captain-marketplace.git") as string;

	userStore.set(MARKETPLACE_INDEX, marketplaceIndex);

	try {
		await removeCaptainData("marketplace");
		await fsp.mkdir(captainDataPath, { recursive: true });
		const command = `cd ${captainDataPath} && git clone ${marketplaceIndex} marketplace-index`;
		await execAsync(command);
	} catch (error) {
		console.error("Error executing command:", error);
	}

	const basePath = path.join(captainDataPath, "marketplace-index", "files"); // The path to the top-level directory

	try {
		const jsonStructure = await createJsonStructure(basePath);
		userStore.set(MARKETPLACE_INDEX_DATA, jsonStructure);
		await fsp.writeFile(
			path.join(captainDataPath, "index.json"),
			JSON.stringify(jsonStructure, null, 2)
		);
	} catch (error) {
		console.error("Error executing command:", error);
	}
}

async function main() {
	await app.whenReady();

	protocol.registerFileProtocol(protocolName, (request, callback) => {
		const url = request.url.replace(`${protocolName}://`, "");
		try {
			return callback(decodeURIComponent(url));
		} catch (error) {
			// Handle the error as needed
			console.error(error);
		}
	});

	// Ensure no active downloads and no caption running
	userStore.delete(CAPTION_RUNNING);
	userStore.delete(DOWNLOADS);
	userStore.delete(MARKETPLACE_INDEX_DATA);

	const mainWindow = await createWindow("main", {
		width: 1600,
		height: 1000,
		minHeight: 600,
		minWidth: 800,
		frame: false,
		webPreferences: {
			// TODO probably fix this
			// eslint-disable-next-line unicorn/prefer-module
			preload: path.join(__dirname, "preload.js"),
		},
	});

	// Remove the default application menu in production
	if (isProduction) {
		Menu.setApplicationMenu(null);
	}

	mainWindow.webContents.setWindowOpenHandler(({ url }) => {
		// Config.fileProtocol is my custom file protocol
		if (url.startsWith(`${protocolName}://`) || url.startsWith("app://")) {
			return { action: "allow" };
		}

		// Open url in a browser and prevent default
		shell.openExternal(url);
		return { action: "deny" };
	});
	const locale = userStore.get(LOCALE) || i18next.i18n.defaultLocale;

	if (isProduction) {
		await mainWindow.loadURL(`app://./${locale}/home`);
	} else {
		const port = process.argv[2];
		await mainWindow.loadURL(`http://localhost:${port}/${locale}/home`);
		// MainWindow.webContents.openDevTools();
	}
}

// eslint-disable-next-line unicorn/prefer-top-level-await
main().then(() => {
	console.log("started");
});

app.on("window-all-closed", () => {
	app.quit();
});
