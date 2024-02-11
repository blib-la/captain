import type { IpcRendererEvent } from "electron";
import { contextBridge, ipcRenderer } from "electron";
import type { Except } from "type-fest";

import {
	BLIP,
	CAPTION,
	DATASET,
	DATASETS,
	DIRECTORY,
	FEEDBACK,
	FETCH,
	GPTV,
	MODEL,
	LOCALE,
	STORE,
	WD14,
	MODELS,
	MARKETPLACE_INDEX,
} from "./helpers/constants";
import type { Dataset } from "./helpers/types";

const handler = {
	store: (data: Record<string, unknown>) => ipcRenderer.invoke(`${STORE}:set`, data),
	fetch: (
		key: string,
		{
			method = "GET",
			data,
		}: { method?: "GET" | "POST" | "DELETE" | "PATCH"; data?: unknown } = {}
	) => ipcRenderer.invoke(`${FETCH}:${method.toLowerCase()}`, key, data),
	sendFeedback: (data: { body: string }) => ipcRenderer.invoke(`${FEEDBACK}:send`, data),
	saveCaption: (imageData: { caption: string; image: string; captionFile: string }) =>
		ipcRenderer.invoke(`${CAPTION}:save`, imageData),
	getDirectory: () => ipcRenderer.invoke(`${DIRECTORY}:get`),
	getLocale: () => ipcRenderer.invoke(`${LOCALE}:get`),
	downloadModel: (type: string, url: string, options: { id: string; storeKey: string }) =>
		ipcRenderer.invoke(`${MODEL}:download`, type, url, options),
	getModels: (type: string) => ipcRenderer.invoke(`${MODELS}:get`, type),
	getDatasets: () => ipcRenderer.invoke(`${DATASETS}:get`),
	createDataset: (directory: string, name: string) =>
		ipcRenderer.invoke(`${DATASET}:create`, directory, name),
	getDataset: (id: string) => ipcRenderer.invoke(`${DATASET}:get`, id),
	updateDataset: (id: string, data: Partial<Except<Dataset, "id">>) =>
		ipcRenderer.invoke(`${DATASET}:update`, id, data),
	deleteDataset: (id: string) => ipcRenderer.invoke(`${DATASET}:delete`, id),
	downloadMarketplace: async (gitRepository: string) =>
		ipcRenderer.invoke(`${MARKETPLACE_INDEX}:download`, gitRepository),
	handleRunBlip: async (directory: string) => ipcRenderer.invoke(`${BLIP}:run`, directory),
	handleRunGPTV: async (
		images: string[],
		options: {
			exampleResponse: string;
			guidelines: string;
			batchSize?: number;
		}
	) => ipcRenderer.invoke(`${GPTV}:run`, images, options),
	handleRunWd14: async (directory: string) => ipcRenderer.invoke(`${WD14}:run`, directory),
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
	handleRunLivePainting: () => ipcRenderer.invoke(`live-painting:start`),
};

contextBridge.exposeInMainWorld("ipc", handler);

export type IpcHandler = typeof handler;
