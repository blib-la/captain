import { contextBridge, ipcRenderer } from "electron";

import { handlers } from "./handlers";

import { buildKey } from "@/shared/build-key";
import { ID, KEY } from "@/shared/enums";

contextBridge.exposeInMainWorld("ipc", {
	...handlers,
	async getMarketplaceData(payload: { url: string; download: boolean }) {
		return ipcRenderer.invoke(buildKey([KEY.MARKETPLACE], { suffix: ":fetch" }), payload);
	},
	appSettingsStore: {
		get<T>(key: string, defaultValue?: T): Promise<T> {
			return ipcRenderer.invoke(
				buildKey([ID.STORE, ID.APP], { suffix: ":get" }),
				key,
				defaultValue
			);
		},
	},
});
