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
 * Sets up listeners for various events from electron-updater.
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
