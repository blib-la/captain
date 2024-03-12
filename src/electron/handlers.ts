import type { IpcRendererEvent } from "electron";
import { ipcRenderer } from "electron";

import { buildKey } from "#/build-key";
import { ID } from "#/enums";

export const handlers = {
	inventoryStore: {
		get<T>(key: string, defaultValue?: T): Promise<T> {
			return ipcRenderer.invoke(
				buildKey([ID.STORE, ID.INVENTORY], { suffix: ":get" }),
				key,
				defaultValue
			);
		},
	},
	writeFile(name: string, content: string, options: { encoding?: BufferEncoding } = {}) {
		return ipcRenderer.invoke(
			buildKey([ID.FILE], { suffix: ":write" }),
			name,
			content,
			options
		);
	},
	readFile(name: string, encoding?: BufferEncoding) {
		return ipcRenderer.invoke(buildKey([ID.FILE], { suffix: ":read" }), name, encoding);
	},
	getFilePath() {
		return ipcRenderer.invoke(buildKey([ID.FILE], { prefix: "path:", suffix: ":get" }));
	},
	getDirectoryPath() {
		return ipcRenderer.invoke(buildKey([ID.DIRECTORY], { prefix: "path:", suffix: ":get" }));
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
