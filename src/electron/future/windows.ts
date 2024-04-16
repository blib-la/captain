import path from "path";

import { app, type BrowserWindow, globalShortcut, ipcMain, screen } from "electron";
import type { BrowserWindowConstructorOptions } from "electron";

import { buildKey } from "#/build-key";
import { ID } from "#/enums";
import { appLoaders } from "@/app-loaders";
import { apps } from "@/apps";
import logger from "@/services/logger";
import { isCoreApp } from "@/utils/core";
import { createWindow } from "@/utils/create-window";
import { loadURL } from "@/utils/load-window";

/**
 * Creates and displays the installer window with predefined dimensions.
 * This window is used during the application's installation or update process.
 * It loads a specific URL that corresponds to the installer interface.
 *
 * @returns {Promise<BrowserWindow>} A promise that resolves to the created BrowserWindow instance for the installer.
 */
export async function createInstallerWindow(): Promise<BrowserWindow> {
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
export async function createPromptWindow() {
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

export async function createCoreAppWindow(
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

export async function createCoreWindow(options: BrowserWindowConstructorOptions = {}) {
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

/**
 * Asynchronously creates and opens a new application window for a specified app,
 * loading its content via a custom, namespaced protocol.
 *
 * @param {string} id - The unique identifier for the app.
 * @param {BrowserWindowConstructorOptions} [options={}] - Optional configuration options for the new BrowserWindow instance.
 * @returns {Promise<BrowserWindow>} A promise that resolves to the created BrowserWindow instance.
 */
export async function createAppWindow(
	id: string,
	options: BrowserWindowConstructorOptions = {}
): Promise<BrowserWindow> {
	console.log(`Created App with ID: ${id} and these options:`, options);
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

export async function openCoreApp(page: string, action?: string) {
	apps.core ||= await createCoreWindow();
	// Add action to the url
	await loadURL(apps.core, `core/${page}${action ? `?action=${action}` : ""}`);
	apps.core.on("close", () => {
		apps.core = null;
	});

	if (apps.core.isMinimized()) {
		apps.core.restore();
	}

	apps.core.focus();
}

export async function openApp(
	appId: string,
	{
		query,
		options,
	}: {
		query?: Record<string, string>;
		options?: BrowserWindowConstructorOptions;
	} = {}
) {
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

export async function openPreviewApp(query?: Record<string, string>) {
	if (!query?.id) {
		logger.error("Missing query.id when attempting to open the preview app");
		return;
	}

	const scopeId = `preview:${query.id ?? ""}`;
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
}
