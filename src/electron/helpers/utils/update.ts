import { BrowserWindow } from "electron";
import { autoUpdater } from "electron-updater";

import { buildKey } from "#/build-key";
import { ID } from "#/enums";
import type { Resource } from "#/types/install";
import type { Manifest, OS } from "#/types/manifest";
import logger from "@/services/logger";
import { appSettingsStore } from "@/stores";

/**
 * Checks for available updates based on the installed versions of resources.
 *
 * @param manifest - The complete resource manifest for all operating systems.
 * @param os - The current operating system to check updates for, which must be one of 'windows', 'macos', or 'linux'.
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
	// autoUpdater.forceDevUpdateConfig = true;

	autoUpdater.on("update-available", data => {
		logger.info(`auto-update: update available`);

		const window_ = BrowserWindow.getFocusedWindow();
		window_!.webContents.send(buildKey([ID.UPDATE], { suffix: ":available" }), data);
	});

	autoUpdater.on("update-downloaded", data => {
		logger.error(`auto-update: update downloaded`);

		const window_ = BrowserWindow.getFocusedWindow();
		window_!.webContents.send(buildKey([ID.UPDATE], { suffix: ":downloaded" }), data);
	});

	autoUpdater.on("error", data => {
		logger.error(`auto-update: ${data}`);
	});

	autoUpdater.on("checking-for-update", () => {});

	autoUpdater.on("update-not-available", data => {});

	autoUpdater.on("download-progress", data => {});
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
