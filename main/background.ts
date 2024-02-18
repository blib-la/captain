import path from "path";

import { app, protocol, shell, Menu } from "electron";
import serve from "electron-serve";

import i18next from "../next-i18next.config.js";
import { version } from "../package.json";

import { createWindow } from "./helpers";
import { APP, CAPTION_RUNNING, DOWNLOADS, INSTALLING_PYTHON, LOCALE } from "./helpers/constants";
import { store as userStore } from "./helpers/store";
import { isProduction, protocolName } from "./helpers/utils";
import { init } from "./init";
import { getInstalledVersion } from "./utils/first-launch";
import "./live-painting";
import "./datasets/ipc";
import "./captions/ipc";
import "./git/ipc";

app.commandLine.appendSwitch("enable-smooth-scrolling");

if (isProduction) {
	serve({ directory: "app" });
} else {
	app.setPath("userData", `${app.getPath("userData")}__development__`);
}

protocol.registerSchemesAsPrivileged([{ scheme: protocolName, privileges: { bypassCSP: true } }]);

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
	userStore.set(INSTALLING_PYTHON, false);

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

	const lastVersion = await getInstalledVersion();
	if (isProduction && lastVersion !== version) {
		init(version);
	}

	if (lastVersion === version) {
		mainWindow.webContents.send(`${APP}:ready`);
	}
}

// eslint-disable-next-line unicorn/prefer-top-level-await
main().then(() => {
	console.log("started");
});

app.on("window-all-closed", () => {
	app.quit();
});
