import type { IpcRendererEvent } from "electron";
import { contextBridge, ipcRenderer } from "electron";

const handler = {
	send(channel: string, value?: unknown) {
		ipcRenderer.send(channel, value);
	},
	on(channel: string, callback: (...arguments_: any[]) => void) {
		function subscription(_event: IpcRendererEvent, ...arguments_: any[]) {
			return callback(...arguments_);
		}

		ipcRenderer.on(channel, subscription);

		return () => {
			ipcRenderer.removeListener(channel, subscription);
		};
	},
};

contextBridge.exposeInMainWorld("ipc", handler);

export type IpcHandler = typeof handler;
