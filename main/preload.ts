import type { IpcRendererEvent } from "electron";
import { contextBridge, ipcRenderer } from "electron";
import type { Except } from "type-fest";

import {
	BLIP,
	CAPTION,
	CAPTIONS,
	DATASET,
	DATASETS,
	DIRECTORY,
	DOWNLOAD,
	FEEDBACK,
	FETCH,
	GPTV,
	LOCALE,
	MARKETPLACE_INDEX,
	MODEL,
	MODELS,
	STORE,
	WD14,
} from "./helpers/constants";
import type { Dataset, DatasetEntry } from "./helpers/types";

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
	download: (url: string, directory: string, options: { storeKey: string }) =>
		ipcRenderer.invoke(`${DOWNLOAD}`, url, directory, options),
	getModels: (type: "loras" | "checkpoints" | "captions") =>
		ipcRenderer.invoke(`${MODELS}:get`, type),
	getDatasets: () => ipcRenderer.invoke(`${DATASETS}:get`),
	createDataset: (directory: string, name: string) =>
		ipcRenderer.invoke(`${DATASET}:create`, directory, name),
	getDataset: (id: string) => ipcRenderer.invoke(`${DATASET}:get`, id),
	updateDataset: (id: string, data: Partial<Except<Dataset, "id">>) =>
		ipcRenderer.invoke(`${DATASET}:update`, id, data),
	deleteDataset: (id: string) => ipcRenderer.invoke(`${DATASET}:delete`, id),
	downloadMarketplace: async (url: string) =>
		ipcRenderer.invoke(`${MARKETPLACE_INDEX}:download`, url),
	handleRunBlip: async (directory: string) => ipcRenderer.invoke(`${BLIP}:run`, directory),
	batchEditCaption: (images: DatasetEntry[]) =>
		ipcRenderer.invoke(`${CAPTIONS}:runBatch`, images),
	handleRunGPTV: async (
		images: string[],
		options: {
			exampleResponse: string;
			guidelines: string;
			batchSize?: number;
		}
	) => ipcRenderer.invoke(`${GPTV}:run`, images, options),
	handleRunWd14: async (
		images: string[],
		options: {
			batchSize?: number;
			model: string;
			exclude: string[];
		}
	) => ipcRenderer.invoke(`${WD14}:run`, images, options),
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
