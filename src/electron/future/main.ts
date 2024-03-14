import fsp from "node:fs/promises";
import path from "path";
import url from "url";

// The @xenova/transformers package is imported directly from GitHub as it includes
// certain functionalities that are not available in the npm published version. This package
// may not have complete type definitions, which can cause TypeScript to raise compilation errors.
// The use of `@ts-ignore` is necessary here to bypass these TypeScript errors.
// However, this is a known issue and has been accounted for in our usage of the library.
// See package.json for the specific version and source of the @xenova/transformers package.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { env } from "@xenova/transformers";
import type { BrowserWindow, BrowserWindowConstructorOptions } from "electron";
import { app, globalShortcut, ipcMain, Menu, protocol, screen } from "electron";
import { globby } from "globby";
import matter from "gray-matter";

import { version } from "../../../package.json";

import { appSettingsStore, userStore } from "./stores";
import { initialize, populateFromDocuments, reset } from "./utils/vector-store";

import { buildKey } from "#/build-key";
import { LOCAL_PROTOCOL } from "#/constants";
import { DownloadState, ID } from "#/enums";
import { isProduction } from "#/flags";

import { CustomHuggingFaceTransformersEmbeddings } from "@/langchain/custom-hugging-face-transformers-embeddings";
import { VectorStore } from "@/services/vector-store";
import { isCoreApp, isCoreView } from "@/utils/core";
import { createWindow } from "@/utils/create-window";
import { loadURL } from "@/utils/load-window";
import { getCaptainData } from "@/utils/path-helpers";

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
	await loadURL(window_, "prompt");
	window_.on("show", () => {
		window_.focus();
		globalShortcut.register("Escape", async () => {
			console.log("Escape is pressed");
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

	ipcMain.on(buildKey([ID.WINDOW], { suffix: ":resize" }), (_event, { height, width }) => {
		if (width && height) {
			console.log(height, width);
			window_.setResizable(true);
			window_.setSize(750, Math.ceil(height));
			window_.setResizable(false);
		}
	});

	const promptShortcut = "Control+Alt+Space";
	globalShortcut.register(promptShortcut, async () => {
		console.log(promptShortcut);
		window_.show();
	});

	app.on("will-quit", () => {
		// Unregister a shortcut.
		globalShortcut.unregister(promptShortcut);
		globalShortcut.unregister("Escape");

		// Unregister all shortcuts.
		globalShortcut.unregisterAll();
	});
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
 * @param {ProtocolRequest} request - The request object provided by Electron's protocol module, containing
 * the URL and other metadata about the request.
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

async function createCoreAppWindow(id: string, options: BrowserWindowConstructorOptions = {}) {
	const appWindow = await createWindow(id, {
		minWidth: 800,
		minHeight: 600,
		width: 1200,
		height: 1000,
		frame: false,
		...options,
		webPreferences: {
			preload: path.join(__dirname, "app-preload.js"),
			...options.webPreferences,
		},
	});

	await loadURL(appWindow, `apps/${id}`);

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
			preload: path.join(__dirname, "preload.js"),
			...options.webPreferences,
		},
	});
}

async function createAppWindow(id: string, options: BrowserWindowConstructorOptions = {}) {
	const appWindow = await createWindow(id, {
		frame: false,
		...options,
		webPreferences: {
			preload: path.join(__dirname, "app-preload.js"),
			...options.webPreferences,
		},
	});

	const appPath = getCaptainData("apps", id, "index.html");
	const appUrl = url.format({
		pathname: appPath,
		protocol: "file:",
		slashes: true,
	});

	await appWindow.loadURL(appUrl);
	return appWindow;
}

// Cache for apps that are opened
const apps: Record<string, BrowserWindow | null> = {};

async function runStartup() {
	apps.prompt = await createPromptWindow();
	apps.core = await createCoreWindow();
	await loadURL(apps.core, `core/dashboard`);
	apps.core.on("close", () => {
		apps.core = null;
	});
	apps.core.focus();
}

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
	await app.whenReady();

	// Initialize the local protocol to allow serving files from disk
	initLocalProtocol();

	const lastAppVersion = appSettingsStore.get("version");
	const appStatus = appSettingsStore.get("status");

	const isUpToDate = version === lastAppVersion || process.env.TEST_VERSION === "upToDate";
	const isReady =
		(appStatus === DownloadState.DONE && process.env.TEST_APP_STATUS !== "IDLE") ||
		process.env.TEST_APP_STATUS === "DONE";

	// Remove the default application menu in production
	if (isProduction) {
		Menu.setApplicationMenu(null);
	}

	ipcMain.on(
		buildKey([ID.APP], { suffix: ":open" }),
		async (_event, { appId, action }: { appId: string; action?: string }) => {
			if (isCoreView(appId)) {
				// If the appId is a core view we need to handle it
				apps.core ||= await createCoreWindow();
				// Add action to the url
				await loadURL(apps.core, `core/${appId}${action ? `?action=${action}` : ""}`);
				apps.core.on("close", () => {
					apps.core = null;
				});
				apps.core.focus();
			} else {
				apps[appId] ||= await (isCoreApp(appId)
					? createCoreAppWindow(appId)
					: createAppWindow(appId));
				apps[appId]!.on("close", () => {
					apps[appId] = null;
					// TODO Needs to ensure that all processes opened by this window are closed
				});
				apps[appId]!.focus();
			}
		}
	);

	if (isUpToDate && isReady) {
		// Start the vector store and fill it with data
		await initialize();
		await reset();
		await populateFromDocuments();

		// Start app
		await runStartup();
	} else {
		// Update app settings for installation
		appSettingsStore.set("status", DownloadState.IDLE);
		appSettingsStore.set("version", version);

		// Create and show installer window
		const installerWindow = await createInstallerWindow();

		// When the installer is done we open the prompt window
		ipcMain.on(buildKey([ID.APP], { suffix: ":ready" }), async () => {
			await runStartup();
			installerWindow.close();
		});
	}
}
