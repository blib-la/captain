import console from "node:console";

import { autoUpdater } from "electron-updater";

import { apps } from "@/electron/apps";
import { logError, logger } from "@/electron/services/logger";
import { appSettingsStore } from "@/electron/stores";
import type { Manifest, OS, Resource } from "@/electron/types";
import { openCore } from "@/electron/windows";
import { buildKey } from "@/shared/build-key";
import { ID } from "@/shared/enums";

/**
 * Checks for available updates based on the installed versions of resources.
 *
 * @param manifest - The complete resource manifest for all operating systems.
 * @param os - The current operating system to check updates for, which must be one of 'windows', 'macOS', or 'linux'.
 *
 * @returns An array of resources that have updates available.
 */
export function checkUpdates(manifest: Manifest, os: OS): Resource[] {
	const updates: Resource[] = [];
	const resources = manifest[os] ?? [];

	for (const resource of resources) {
		const resourceName = resource.name;
		const expectedVersion = resource.version;
		const installedVersion = appSettingsStore.get(`resources.${resourceName}.version`);

		if (installedVersion !== expectedVersion) {
			updates.push(resource);
		}
	}

	return updates;
}

/**
 * Sets up listeners for various events from electron-updater to handle different stages of the update process.
 * This function configures the update behavior and binds event handlers to specific update events to manage the application's response to these events effectively.
 *
 * Events handled:
 * - "update-available": Logs the availability of an update and opens the core settings window to notify the user.
 * - "update-downloaded": Logs the completion of an update download, opens the core settings, and notifies the user that the update is ready to install.
 * - "error": Logs any errors that occur during the update process and notifies the user via the core settings window.
 * - "checking-for-update": Logs when the updater starts checking for an update.
 * - "update-not-available": Logs when no updates are available after a check and notifies the user.
 * - "download-progress": Logs the progress of an ongoing download. This is particularly useful for debugging in development.
 *
 * Configurations:
 * - Enables pre-release versions to be considered in updates.
 * - Disables automatic download of updates; requires manual trigger to download.
 * - Optionally sets a development-specific configuration to force update checks without needing to package the app (commented out by default).
 */
export function listenForUpdates() {
	// Enable pre-release versions
	autoUpdater.allowPrerelease = true;

	// Don't download automatically
	autoUpdater.autoDownload = false;

	// For local development without the need to pack the application
	// autoUpdater.forceDevUpdateConfig = isDevelopment;

	autoUpdater.on("update-available", async data => {
		logger.info("auto-update: update available");

		await openCore("settings");
		apps.core!.webContents.send(buildKey([ID.UPDATE], { suffix: ":available" }), data);
	});

	autoUpdater.on("update-downloaded", async data => {
		logger.info("auto-update: update downloaded");

		await openCore("settings");
		apps.core!.webContents.send(buildKey([ID.UPDATE], { suffix: ":downloaded" }), data);
	});

	autoUpdater.on("error", async data => {
		logError(data, "auto-update");

		await openCore("settings");
		apps.core!.webContents.send(buildKey([ID.UPDATE], { suffix: ":error" }), data);
	});

	autoUpdater.on("checking-for-update", () => {
		logger.info("auto-update: on -> checking-for-update");

		apps.core?.webContents.send(
			buildKey([ID.UPDATE], { suffix: ":checking-for-update" }),
			true
		);
	});

	autoUpdater.on("update-not-available", async data => {
		logger.info("auto-update: on -> update-not-available", data);

		await openCore("settings");
		apps.core!.webContents.send(buildKey([ID.UPDATE], { suffix: ":not-available" }), data);
	});

	autoUpdater.on("download-progress", data => {
		// Use native log here as this is only useful while developing
		console.log("auto-update: on -> download-progress", data);

		apps.core?.webContents.send(buildKey([ID.UPDATE], { suffix: ":error" }), data);
	});
}

/**
 * Triggers a check for updates and notifies the user if an update is available.
 */
export async function checkCoreUpdates(): Promise<void> {
	await autoUpdater.checkForUpdatesAndNotify();
}

/**
 * Downloads the update if any updates are available.
 */
export async function downloadCoreUpdate(): Promise<void> {
	await autoUpdater.downloadUpdate();
}

/**
 * Restarts the application and installs the downloaded update.
 */
export function restartAndInstall(): void {
	autoUpdater.quitAndInstall();
}
