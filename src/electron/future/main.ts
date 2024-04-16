import { DownloadState } from "@captn/utils/constants";
import type { BrowserWindowConstructorOptions } from "electron";
import { app, ipcMain, Menu } from "electron";

import { version } from "../../../package.json";

import { appSettingsStore } from "./stores";

import { buildKey } from "#/build-key";
import { ID } from "#/enums";
import { isProduction } from "#/flags";
import { apps } from "@/apps";
import { initLocalProtocol } from "@/init-local-protocol";
import { runStartup } from "@/run-startup";
import logger from "@/services/logger";
import { createTray } from "@/tray";
import { isCoreView } from "@/utils/core";
import { initialize, populateFromDocuments, reset } from "@/utils/vector-store";
import {
	createCoreWindow,
	createInstallerWindow,
	openApp,
	openCoreApp,
	openPreviewApp,
} from "@/windows";

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

	await app.whenReady();
	logger.info(`main(): app is ready`);

	// Initialize the local protocol to allow serving files from disk
	initLocalProtocol();

	// Create the system tray
	createTray();

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
				await openCoreApp(appId, action);
			} else if (appId === "preview") {
				await openPreviewApp(query);
			} else {
				await openApp(appId, { options, query });
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
