import type { SDKMessage } from "@captn/react/types";
import { APP_MESSAGE_KEY } from "@captn/utils/constants";
import { contextBridge, ipcRenderer, type IpcRendererEvent } from "electron";

import { buildKey } from "@/shared/build-key";
import { ID } from "@/shared/enums";

const allowedMethods = new Set([buildKey([ID.COMFYUI_PORT], { suffix: ":get" })]);
contextBridge.exposeInMainWorld("ipc", {
	send(channel: string, value?: unknown) {
		if (allowedMethods.has(channel)) {
			ipcRenderer.send(channel, value);
		} else if (
			channel === APP_MESSAGE_KEY &&
			(value as { message: SDKMessage<{ freeMemory?: boolean; unloadModels?: boolean }> })
				?.message?.action === "comfyui:free"
		) {
			ipcRenderer.send(channel, value);
		}
	},
	on(channel: string, callback: (...arguments_: unknown[]) => void) {
		function subscription(_event: IpcRendererEvent, ...arguments_: unknown[]) {
			return callback(...arguments_);
		}

		if (allowedMethods.has(channel)) {
			ipcRenderer.on(channel, subscription);

			return () => {
				ipcRenderer.removeListener(channel, subscription);
			};
		}
	},
});
