import { contextBridge, ipcRenderer } from "electron";

import { handlers } from "./handlers";

import { buildKey } from "#/build-key";
import { KEY } from "#/enums";

contextBridge.exposeInMainWorld("ipc", {
	...handlers,
	async getMarketplaceData(payload: { url: string; download: boolean }) {
		return ipcRenderer.invoke(buildKey([KEY.MARKETPLACE], { suffix: ":fetch" }), payload);
	},
});
