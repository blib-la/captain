import { DownloadState } from "@captn/utils/constants";
import type { BrowserWindowConstructorOptions } from "electron";
import { app, ipcMain, Menu } from "electron";

import { version } from "../../../package.json";

import { appSettingsStore } from "./stores";

import { buildKey } from "#/build-key";
import { ID } from "#/enums";
import { isProduction } from "#/flags";
import manifest from "#/manifest.json";
import type { Manifest } from "#/types/manifest";
import { apps } from "@/apps";
import { initLocalProtocol } from "@/init-local-protocol";
import { runStartup } from "@/run-startup";
import logger from "@/services/logger";
import { createTray } from "@/tray";
import { isCoreApp, isCoreView } from "@/utils/core";
import { checkUpdates } from "@/utils/update";
import { initialize, populateFromDocuments, reset } from "@/utils/vector-store";
import {
	createCoreWindow,
	createInstallerWindow,
	handleCoreAppWindow,
	openApp,
	openCore,
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

	// Find updates for windows
	const updates = checkUpdates(manifest as Manifest, "windows");

	// Find out if the user already has resources downloaded, which means
	// the installation was done at least once
	const hasResources =
		appSettingsStore.get("resources") !== undefined ||
		process.env.TEST_APP_STATUS === DownloadState.UPDATE;

	// Is Captain up to date?
	const isUpToDate =
		(updates.length === 0 && hasResources) || process.env.TEST_VERSION === "upToDate";

	logger.info(`main(): app is upToDate ${isUpToDate}`);

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
				await openCore(appId, action);
			} else if (appId === "preview") {
				await openPreviewApp(query);
			} else if (isCoreApp(appId)) {
				await handleCoreAppWindow(appId, query ?? {}, options ?? {});
			} else {
				logger.info(`Opening app with ID: ${appId}`, { options, query });
				await openApp(appId, { options, query });
			}
		}
	);

	logger.info(`main(): listened to :open`);

	if (isUpToDate) {
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
		let step = "";

		// When the user already has settings (setup ran at least once),
		// we skip the first 2 steps and go straight to
		// downloading the necessary resource updates
		if (hasResources) {
			appSettingsStore.set("status", DownloadState.UPDATE);
			step = "installer/02-update";
		} else {
			appSettingsStore.set("status", DownloadState.IDLE);
			step = "installer/00";
		}

		logger.info(`main(): start installer on step "${step}"`);

		// Create and show the installer window
		const installerWindow = await createInstallerWindow({ step });

		app.on("second-instance", async () => {
			apps.core ||= await createCoreWindow();

			if (installerWindow.isMinimized()) {
				installerWindow.restore();
			}

			installerWindow.focus();
		});

		// When the installer is done we open the prompt window & update the version
		ipcMain.on(buildKey([ID.APP], { suffix: ":ready" }), async () => {
			// Start the vector store and fill it with data
			await initialize();
			await reset();
			await populateFromDocuments();
			logger.info(`main(): initialized vector store`);

			await runStartup();
			installerWindow.close();

			appSettingsStore.set("version", version);
		});
	}
}
