import { USER_LANGUAGE_KEY, USER_THEME_KEY } from "@captn/utils/constants";
import { BrowserWindow } from "electron";

import { appSettingsStore, downloadsStore, inventoryStore, userStore } from "@/electron/stores";
import { traverseAndModify } from "@/electron/utils/download-restart";

export function sendToFocusedWindow<T>(key: string, value: T) {
	const window_ = BrowserWindow.getFocusedWindow();
	if (window_) {
		window_.webContents.send(key, value);
	}
}

export function sendToAllWindows<T>(key: string, value: T) {
	const windows_ = BrowserWindow.getAllWindows();
	for (const window_ of windows_) {
		window_.webContents.send(key, value);
	}
}

export function watchStores() {
	const subscriptions: (() => void)[] = [];
	downloadsStore.store = traverseAndModify(downloadsStore.store);
	appSettingsStore.set("requiresRestart", false);
	subscriptions.push(
		userStore.onDidChange("language", language => {
			if (language) {
				sendToAllWindows(USER_LANGUAGE_KEY, language);
			}
		}),
		userStore.onDidChange("theme", theme => {
			if (theme) {
				sendToAllWindows(USER_THEME_KEY, theme);
			}
		}),
		// We need to cast the type to any to allow dot-prop
		inventoryStore.onDidChange("files.image" as keyof typeof inventoryStore.store, images => {
			if (images) {
				sendToAllWindows("images", images);
			}
		}),
		inventoryStore.onDidChange(
			"stable-diffusion.checkpoints" as keyof typeof inventoryStore.store,
			checkpoints => {
				if (checkpoints) {
					sendToAllWindows("stable-diffusion.checkpoints", checkpoints);
				}
			}
		),
		inventoryStore.onDidChange(
			"stable-diffusion.vae" as keyof typeof inventoryStore.store,
			vae => {
				if (vae) {
					sendToAllWindows("stable-diffusion.vae", vae);
				}
			}
		),
		inventoryStore.onDidAnyChange(inventory => {
			sendToAllWindows("allInventory", inventory);
		}),
		downloadsStore.onDidAnyChange(downloads => {
			sendToAllWindows("allDownloads", downloads);
		})
	);

	return async () => {
		await Promise.all(subscriptions.map(unsubscribe_ => unsubscribe_()));
	};
}
