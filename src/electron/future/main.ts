import path from "path";

import { app, ipcMain, Menu, screen } from "electron";

import { version } from "../../../package.json";

import { appSettingsStore } from "./stores";

import { buildKey } from "#/build-key";
import { DownloadState, ID } from "#/enums";
import { isProduction } from "#/flags";
import { createWindow } from "@/utils/create-window";
import { loadURL } from "@/utils/load-window";

/**
 * Creates and displays the installer window with predefined dimensions.
 * This window is used during the application's installation or update process.
 * It loads a specific URL that corresponds to the installer interface.
 *
 * @returns {Promise<BrowserWindow>} A promise that resolves to the created BrowserWindow instance for the installer.
 */
async function createInstallerWindow() {
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
		webPreferences: {
			preload: path.join(__dirname, "preload.js"),
			contextIsolation: true,
			nodeIntegration: false,
		},
	});

	await loadURL(installerWindow, "installer/00");
	return installerWindow;
}

/**
 * Asynchronously creates and displays the main application window, adjusting its size
 * to fit within the user's screen resolution. It waits for the Electron app to be ready before
 * creating the window. The dimensions are set to a default or lesser value based on the screen size,
 * ensuring the window fits comfortably on the user's screen.
 *
 * @returns {Promise<BrowserWindow>} A promise that resolves to the created BrowserWindow instance for the main application interface.
 */
async function createMainWindow() {
	// Ens
	const { width, height } = screen.getPrimaryDisplay().workAreaSize;

	const mainWindow = await createWindow("main", {
		width: Math.min(1400, width),
		height: Math.min(850, height),
		minWidth: 800,
		minHeight: 600,
		frame: false,
		webPreferences: {
			preload: path.join(__dirname, "preload.js"),
			contextIsolation: true,
			nodeIntegration: false,
		},
	});

	await loadURL(mainWindow, "dashboard");
	return mainWindow;
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

	const lastAppVersion = appSettingsStore.get("version");
	const appStatus = appSettingsStore.get("status");

	const isUpToDate = version === lastAppVersion || process.env.TEST_VERSION === "upToDate";
	const isReady = appStatus === DownloadState.DONE || process.env.TEST_APP_STATUS === "DONE";

	// Remove the default application menu in production
	if (isProduction) {
		Menu.setApplicationMenu(null);
	}

	if (isUpToDate && isReady) {
		// Close installer window if open
		// Create and show the main application window
		await createMainWindow();
	} else {
		// Update app settings for installation
		appSettingsStore.set("status", DownloadState.IDLE);
		appSettingsStore.set("version", version);
		// Create and show installer window
		const installerWindow = await createInstallerWindow();
		// When the installer is done we open the main window
		ipcMain.on(buildKey([ID.APP], { suffix: ":ready" }), async () => {
			installerWindow.close();
			await createMainWindow();
		});
	}
}
