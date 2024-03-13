import { USER_LANGUAGE_KEY, USER_THEME_KEY } from "@captn/utils/constants";
import type { Unsubscribe } from "conf/dist/source/types";
import { BrowserWindow } from "electron";

import { inventoryStore, userStore } from "@/stores";

function sendToFocusedWindow<T>(key: string, value: T) {
	const window_ = BrowserWindow.getFocusedWindow();
	if (window_) {
		window_.webContents.send(key, value);
	}
}

function sendToAllWindows<T>(key: string, value: T) {
	const windows_ = BrowserWindow.getAllWindows();
	for (const window_ of windows_) {
		window_.webContents.send(key, value);
	}
}

export function watchStores() {
	const subscriptions: Unsubscribe[] = [];
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
		inventoryStore.onDidChange<any>("files.image", images => {
			if (images) {
				sendToAllWindows("images", images);
			}
		})
	);

	return async () => {
		await Promise.all(subscriptions.map(unsubscribe_ => unsubscribe_()));
	};
}
