import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "path";

import { DownloadState } from "@captn/utils/constants";
import type { BrowserWindow, BrowserWindowConstructorOptions } from "electron";
import { app, globalShortcut, ipcMain, Menu, protocol, screen, Tray } from "electron";
import serve from "electron-serve";
import type electronServe from "electron-serve";
import { globby, globbySync } from "globby";

import { version } from "../../../package.json";

import { appSettingsStore } from "./stores";

import { buildKey } from "#/build-key";
import { LOCAL_PROTOCOL } from "#/constants";
import { ID } from "#/enums";
import { isProduction } from "#/flags";
import { apps } from "@/apps";
import logger from "@/services/logger";
import { isCoreApp, isCoreView } from "@/utils/core";
import { createWindow } from "@/utils/create-window";
import { loadURL } from "@/utils/load-window";
import {
	getCaptainData,
	getCaptainTemporary,
	getDirectory,
	getUserData,
} from "@/utils/path-helpers";
import { initialize, populateFromDocuments, reset } from "@/utils/vector-store";

/**
 * Creates and displays the installer window with predefined dimensions.
 * This window is used during the application's installation or update process.
 * It loads a specific URL that corresponds to the installer interface.
 *
 * @returns {Promise<BrowserWindow>} A promise that resolves to the created BrowserWindow instance for the installer.
 */
async function createInstallerWindow(): Promise<BrowserWindow> {
	const { width, height } = screen.getPrimaryDisplay().workAreaSize;
	const windowWidth = Math.min(600, width);
	const windowHeight = Math.min(700, height);
	const installerWindow = await createWindow("installer", {
		width: windowWidth,
		height: windowHeight,
		minWidth: windowWidth,
		minHeight: windowHeight,
		maxWidth: windowWidth,
		maxHeight: windowHeight,
		frame: false,
	});

	await loadURL(installerWindow, "installer/00");
	return installerWindow;
}

/**
 *
 */
async function createPromptWindow() {
	logger.info(`createPromptWindow(): started`);
	const window_ = await createWindow("main", {
		width: 750,
		height: 112,
		minWidth: 750,
		maxWidth: 750,
		frame: false,
		alwaysOnTop: true,
		minimizable: false,
		maximizable: false,
		fullscreen: false,
		fullscreenable: false,
		transparent: true,
		resizable: false,
		show: false,
	});
	logger.info(`createPromptWindow(): created main window`);

	await loadURL(window_, "prompt");
	logger.info(`createPromptWindow(): loaded prompt`);

	window_.on("show", () => {
		window_.focus();
		globalShortcut.register("Escape", async () => {
			window_.hide();
		});
	});
	window_.on("hide", () => {
		globalShortcut.unregister("Escape");
	});
	window_.on("focus", () => {
		window_.webContents.send(buildKey([ID.WINDOW], { suffix: ":focus" }));
	});

	window_.on("blur", () => {
		window_.hide();
	});
	logger.info(`createPromptWindow(): added window listener`);

	ipcMain.on(buildKey([ID.WINDOW], { suffix: ":resize" }), (_event, { height, width }) => {
		if (width && height) {
			window_.setResizable(true);
			window_.setSize(750, Math.ceil(height));
			window_.setResizable(false);
		}
	});
	logger.info(`createPromptWindow(): added ipc listener: resize`);

	const promptShortcut = "Control+Alt+Space";
	globalShortcut.register(promptShortcut, async () => {
		window_.show();
	});
	logger.info(`createPromptWindow(): added global shortcut listener`);

	app.on("will-quit", () => {
		// Unregister a shortcut.
		globalShortcut.unregister(promptShortcut);
		globalShortcut.unregister("Escape");

		// Unregister all shortcuts.
		globalShortcut.unregisterAll();
	});
	logger.info(`createPromptWindow(): added app listener: will-quit`);

	return window_;
}

/**
 * Handles requests to a custom protocol for serving local files in an Electron application.
 * This function is part of the setup to allow Electron to serve local files using a custom protocol,
 * identified by `LOCAL_PROTOCOL`, which is a constant containing the protocol name (e.g., 'captain').
 *
 * The custom protocol handler is designed to intercept requests made to this protocol, parse the
 * requested file's path from the URL, and serve the file directly from the disk. This approach enables
 * the loading of local resources in a secure and controlled manner, bypassing the limitations of the
 * `file://` protocol in web contexts, and providing more flexibility in handling file requests.
 *
 *
 * Usage:
 * 1. Register the custom protocol and its handler early in the application's lifecycle, ideally in the
 *    main process's `app.whenReady()` callback.
 * 2. Construct URLs using the custom protocol to request local files, formatting the path as follows:
 *    `${LOCAL_PROTOCOL}://<absolutePathOnDisk>`, where `<absolutePathOnDisk>` is the full path to the file,
 *    with backslashes (`\`) replaced by forward slashes (`/`) and properly URL-encoded to handle spaces
 *    and special characters.
 *
 *
 * This function normalizes the file path extracted from the URL, reads the file from the disk, and
 * returns a response object containing the file content. If the file cannot be found or read, it
 * logs an error and returns a 404 response.
 *
 * The `Content-Type` header is set to "application/octet-stream" by default, which treats the file
 * as binary data. You may need to adjust this based on the type of files you are serving to ensure
 * proper handling by the client.
 *
 * Important:
 * - Ensure the custom protocol is registered using `protocol.registerSchemesAsPrivileged` before setting
 *   up the handler to grant it necessary privileges, such as bypassing CSP restrictions.
 * - Proper error handling and validation are crucial to prevent security issues, such as directory
 *   traversal attacks.
 * - This setup assumes that the application has permission to access the files it attempts to serve,
 *   and appropriate security measures are in place to safeguard sensitive data.
 * @example
 * <img src={`${LOCAL_PROTOCOL}://C:/path/to/your/image.png`} />
 */
export function initLocalProtocol() {
	protocol.handle(LOCAL_PROTOCOL, async request => {
		const url = new URL(request.url);
		// Normalize the file path: convert URL path to a valid file system path
		const filePath = path.normalize(`${url.hostname}:${url.pathname}`);
		try {
			// Attempt to read the requested file from the disk
			const file = await fsp.readFile(filePath);
			// If successful, return the file content with a generic binary data MIME type
			return new Response(file, { headers: { "Content-Type": "application/octet-stream" } });
		} catch (error) {
			// Log and return an error response if the file cannot be read
			console.error(`Failed to read ${filePath}:`, error);
			return new Response("File not found", { status: 404 });
		}
	});
}

async function createCoreAppWindow(
	id: string,
	query = "",
	options: BrowserWindowConstructorOptions = {}
) {
	const appWindow = await createWindow(id, {
		minWidth: 800,
		minHeight: 600,
		width: 1200,
		height: 1000,
		frame: false,
		...options,
		webPreferences: {
			...options.webPreferences,
			preload: path.join(__dirname, "app-preload.js"),
		},
	});

	await loadURL(appWindow, `apps/${id}?${query}`);

	return appWindow;
}

async function createCoreWindow(options: BrowserWindowConstructorOptions = {}) {
	return createWindow("core", {
		minWidth: 800,
		minHeight: 600,
		width: 1200,
		height: 1000,
		frame: false,
		...options,
		webPreferences: {
			...options.webPreferences,
			preload: path.join(__dirname, "preload.js"),
		},
	});
}

// Discover all installed apps based on the presence of an 'index.html' in their respective directories.
const installedApps = globbySync(["*/index.html"], { cwd: getCaptainData("apps") });

const appLoaders: Record<string, electronServe.loadURL> = {};

// Register a custom protocol for each installed app, allowing them to be served statically.
for (const installedApp of installedApps) {
	const { dir } = path.parse(installedApp);
	const id = dir.split("/").pop()!;

	appLoaders[id] = serve({
		directory: getCaptainData(`apps`, id),
		scheme: `captn-${id}`,
		hostname: "localhost",
		file: "index",
	});
}

/**
 * Asynchronously creates and opens a new application window for a specified app,
 * loading its content via a custom, namespaced protocol.
 *
 * @param {string} id - The unique identifier for the app.
 * @param {BrowserWindowConstructorOptions} [options={}] - Optional configuration options for the new BrowserWindow instance.
 * @returns {Promise<BrowserWindow>} A promise that resolves to the created BrowserWindow instance.
 */
async function createAppWindow(
	id: string,
	options: BrowserWindowConstructorOptions = {}
): Promise<BrowserWindow> {
	console.log(id, { options });
	const appWindow = await createWindow(id, {
		frame: false,
		...options,
		webPreferences: {
			...options.webPreferences,
			preload: path.join(__dirname, "app-preload.js"),
		},
	});

	try {
		await appLoaders[id](appWindow);
	} catch (error) {
		console.log(error);
	}

	return appWindow;
}

async function runStartup() {
	logger.info(`runStartup(): started`);

	apps.prompt = await createPromptWindow();
	logger.info(`runStartup(): created prompt window`);

	apps.core = await createCoreWindow();
	logger.info(`runStartup(): created core window`);

	await loadURL(apps.core, `core/dashboard`);
	logger.info(`runStartup(): loaded core/dashboard`);

	apps.core.on("close", () => {
		apps.core = null;
	});
	apps.core.focus();
	logger.info(`runStartup(): focused core window`);
}

export async function cleanFiles() {
	if (fs.existsSync(getCaptainData("windows"))) {
		await fsp.rm(getCaptainData("windows"), { recursive: true });
	}

	if (fs.existsSync(getCaptainTemporary())) {
		await fsp.rm(getCaptainTemporary(), { recursive: true });
	}

	// Remove legacy top level window stores
	const oldStores = await globby(["STORE-WINDOW--*.json"], { cwd: getUserData() });
	await Promise.all(oldStores.map(async filePath => fsp.rm(filePath)));
}

let tray = null;

/**
 * Initializes the application by determining its current state based on version and setup status.
 * It awaits Electron's readiness before proceeding with either launching the main application window
 * or initiating the installer process, based on whether the application is up-to-date and fully set up.
 * In production environments, it also ensures that the default application menu is removed for a cleaner UI.
 *
 * The function performs the following checks and actions:
 * - Retrieves the last known app version and status from `appSettingsStore`.
 * - Compares the current app version with the stored version to determine if an update is needed.
 * - Checks if the application's setup status is marked as completed.
 * - If the app is up-to-date and ready, it directly opens the main application window.
 * - Otherwise, it updates the app settings to reflect the ongoing setup process and opens the installer window.
 * - Optionally, after the installer window is closed, it transitions to opening the main application window.
 * - In production mode, it removes the default application menu to align with the custom UI design.
 */
export async function main() {
	logger.info(`main(): started`);

	// Clean all temporary files upon startup
	await cleanFiles();
	await app.whenReady();
	tray = new Tray(getDirectory("icon.png"));
	const contextMenu = Menu.buildFromTemplate([
		{
			label: "Quit Captain",
			type: "normal",
			click() {
				app.quit();
			},
		},
	]);
	tray.setToolTip("Captain");
	tray.setContextMenu(contextMenu);
	logger.info(`main(): app is ready`);

	// Initialize the local protocol to allow serving files from disk
	initLocalProtocol();

	logger.info(`main(): local protocol initialized`);

	const lastAppVersion = appSettingsStore.get("version");
	const appStatus = appSettingsStore.get("status");

	const isUpToDate = version === lastAppVersion || process.env.TEST_VERSION === "upToDate";
	const isReady =
		(appStatus === DownloadState.DONE && process.env.TEST_APP_STATUS !== "IDLE") ||
		process.env.TEST_APP_STATUS === "DONE";

	logger.info(`main(): app is upToDate ${isUpToDate} and ready ${isReady}`);

	if (isProduction) {
		Menu.setApplicationMenu(null);

		logger.info(`main(): removed default application menu`);
	}

	ipcMain.on(
		buildKey([ID.APP], { suffix: ":open" }),
		async (
			_event,
			{
				appId,
				action,
				options,
				query,
			}: {
				appId: string;
				action?: string;
				options?: BrowserWindowConstructorOptions;
				query?: Record<string, string>;
			}
		) => {
			if (isCoreView(appId)) {
				// If the appId is a core view we need to handle it
				apps.core ||= await createCoreWindow();
				// Add action to the url
				await loadURL(apps.core, `core/${appId}${action ? `?action=${action}` : ""}`);
				apps.core.on("close", () => {
					apps.core = null;
				});

				if (apps.core.isMinimized()) {
					apps.core.restore();
				}

				apps.core.focus();
			} else if (appId === "preview") {
				const scopeId = `${appId}:${query?.id ?? ""}`;
				apps[scopeId] ||= await createCoreAppWindow(
					"preview",
					new URLSearchParams(query ?? {}).toString()
				);
				apps[scopeId]!.on("close", () => {
					apps[scopeId] = null;
				});
				if (apps[scopeId]!.isMinimized()) {
					apps[scopeId]!.restore();
				}

				apps[scopeId]!.focus();
			} else {
				apps[appId] ||= await (isCoreApp(appId)
					? createCoreAppWindow(appId, query ? new URLSearchParams(query).toString() : "")
					: createAppWindow(appId, options));
				apps[appId]!.on("close", () => {
					apps[appId] = null;
					// TODO Needs to ensure that all processes opened by this window are closed
				});
				if (apps[appId]!.isMinimized()) {
					apps[appId]!.restore();
				}

				apps[appId]!.focus();
			}
		}
	);

	logger.info(`main(): listened to :open`);

	if (isUpToDate && isReady) {
		app.on("second-instance", async () => {
			apps.core ||= await createCoreWindow();

			if (apps.core) {
				if (apps.core.isMinimized()) {
					apps.core.restore();
				}

				apps.core.focus();
			}
		});
		// Start the vector store and fill it with data
		await initialize();
		await reset();
		await populateFromDocuments();
		logger.info(`main(): initialized vector store`);

		// Start app
		await runStartup();
	} else {
		// Update app settings for installation
		appSettingsStore.set("status", DownloadState.IDLE);
		appSettingsStore.set("version", version);

		// Create and show installer window
		const installerWindow = await createInstallerWindow();

		app.on("second-instance", async () => {
			apps.core ||= await createCoreWindow();

			if (installerWindow.isMinimized()) {
				installerWindow.restore();
			}

			installerWindow.focus();
		});

		// When the installer is done we open the prompt window
		ipcMain.on(buildKey([ID.APP], { suffix: ":ready" }), async () => {
			await runStartup();
			installerWindow.close();
		});
	}
}
