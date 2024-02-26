import type { IpcRendererEvent } from "electron";
import { contextBridge, ipcRenderer } from "electron";

import { buildKey } from "#/build-key";
import { ID } from "#/enums";

const handler = {
	saveFile(name: string, content: string, options: { encoding?: BufferEncoding } = {}) {
		return ipcRenderer.invoke(buildKey([ID.FILE], { suffix: ":save" }), name, content, options);
	},
	readFile(name: string) {
		return ipcRenderer.invoke(buildKey([ID.FILE], { suffix: ":read" }), name);
	},
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
