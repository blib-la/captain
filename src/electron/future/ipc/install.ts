import { DownloadState } from "@captn/utils/constants";
import { BrowserWindow, ipcMain } from "electron";
import { download } from "electron-dl";

import { buildKey } from "#/build-key";
import { ID } from "#/enums";
import manifest from "#/manifest.json";
import type { Resource } from "#/types/install";
import type { Manifest } from "#/types/manifest";
import { appSettingsStore } from "@/stores";
import { getCaptainData, getCaptainDownloads, getDirectory } from "@/utils/path-helpers";
import { unpack } from "@/utils/unpack";
import { checkUpdates } from "@/utils/update";

ipcMain.on(buildKey([ID.INSTALL], { suffix: ":start" }), async _event => {
	const window_ = BrowserWindow.getFocusedWindow();
	if (!window_) {
		return;
	}

	// Get the needed updates
	const updates: Resource[] = checkUpdates(manifest as Manifest, "windows");

	try {
		const items: Promise<void>[] = [];
		for (const resource of updates) {
			// TODO: Iterate over sources
			const { destination, unzip, name, size, url } = resource.sources[0];

			await download(window_, url, {
				directory: getCaptainDownloads(),

				onStarted() {
					appSettingsStore.set("status", DownloadState.ACTIVE);
					window_.webContents.send(buildKey([ID.INSTALL], { suffix: ":started" }), {
						name,
						size,
					});
				},
				onProgress(progress) {
					window_.webContents.send(
						buildKey([ID.INSTALL], { suffix: ":progress" }),
						progress
					);
				},
				onCancel() {
					window_.webContents.send(buildKey([ID.INSTALL], { suffix: ":canceled" }), true);
					appSettingsStore.set("status", DownloadState.CANCELED);
				},
				async onCompleted(file) {
					const targetPath = getCaptainData(destination);

					if (unzip) {
						// Unpack immediately and send to array to allow awaiting multiple unzips
						items.push(
							unpack(
								getDirectory("7zip", "win", "7za.exe"),
								file.path,
								targetPath,
								true
							)
						);
					}
				},
			});
		}

		// Set the state to unpacking and wait until all items are unpacked and ready
		window_.webContents.send(buildKey([ID.INSTALL], { suffix: ":unpacking" }), true);
		appSettingsStore.set("status", DownloadState.UNPACKING);
		await Promise.all(items);

		// Set the new version of the resources so we know that those have been updated
		for (const resource of updates) {
			const { name, version } = resource;

			appSettingsStore.set(`resources.${name}.version`, version);
		}

		// Everything was downloaded & unpacked
		window_.webContents.send(buildKey([ID.INSTALL], { suffix: ":completed" }), true);
		appSettingsStore.set("status", DownloadState.DONE);
	} catch (error) {
		if (error instanceof Error) {
			window_.webContents.send(buildKey([ID.INSTALL], { suffix: ":failed" }), error.message);
			appSettingsStore.set("status", DownloadState.FAILED);
		}
	}
});
