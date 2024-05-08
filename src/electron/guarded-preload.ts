import { contextBridge, ipcRenderer, type IpcRendererEvent } from "electron";

import { buildKey } from "@/shared/build-key";
import { ID } from "@/shared/enums";

contextBridge.exposeInMainWorld("ipc", {
	send(channel: string, value?: unknown) {
		if (channel === buildKey([ID.COMFYUI_PORT], { suffix: ":get" })) {
			ipcRenderer.send(channel, value);
		}
	},
	on(channel: string, callback: (...arguments_: unknown[]) => void) {
		function subscription(_event: IpcRendererEvent, ...arguments_: unknown[]) {
			return callback(...arguments_);
		}

		if (channel === buildKey([ID.COMFYUI_PORT], { suffix: ":get" })) {
			ipcRenderer.on(channel, subscription);

			return () => {
				ipcRenderer.removeListener(channel, subscription);
			};
		}
	},
});
