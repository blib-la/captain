import type { IpcRendererEvent } from "electron";
import { contextBridge, ipcRenderer } from "electron";
import type { Except } from "type-fest";

import {
	BLIP,
	CAPTION,
	DATASET,
	DATASETS,
	DIRECTORY,
	EXISTING_PROJECT,
	FEEDBACK,
	FETCH,
	GPTV,
	MODEL,
	IMAGE_CACHE,
	LOCALE,
	PROJECT,
	PROJECTS,
	STORE,
	WD14,
	MODELS,
	MARKETPLACE_INDEX,
} from "./helpers/constants";
import type { Project } from "./helpers/types";

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
	createImageCache: (directory: string, name: string) =>
		ipcRenderer.invoke(`${IMAGE_CACHE}:create`, directory, name),
	downloadModel: (type: string, url: string, options: { id: string; storeKey: string }) =>
		ipcRenderer.invoke(`${MODEL}:download`, type, url, options),
	getModels: (type: string) => ipcRenderer.invoke(`${MODELS}:get`, type),
	getExistingProject: (project: { id: string; cover?: string; name: string; source: string }) =>
		ipcRenderer.invoke(`${EXISTING_PROJECT}:get`, project),
	// TODO migrate to datasets
	getProjects: () => ipcRenderer.invoke(`${PROJECTS}:get`),
	getDatasets: () => ipcRenderer.invoke(`${DATASETS}:get`),
	getDataset: (id: string) => ipcRenderer.invoke(`${DATASET}:get`, id),
	updateDataset: (id: string, data: Partial<Except<Project, "id">>) =>
		ipcRenderer.invoke(`${DATASET}:update`, id, data),
	// TODO migrate to dataset
	deleteProject: (id: string) => ipcRenderer.invoke(`${PROJECT}:delete`, id),
	deleteDataset: (id: string) => ipcRenderer.invoke(`${DATASET}:delete`, id),
	downloadMarketplace: async (gitRepository: string) =>
		ipcRenderer.invoke(`${MARKETPLACE_INDEX}:download`, gitRepository),
	handleRunBlip: async (directory: string) => ipcRenderer.invoke(`${BLIP}:run`, directory),
	handleRunGPTV: async (
		directory: string,
		options: {
			exampleResponse: string;
			guidelines: string;
			batchSize?: number;
		}
	) => ipcRenderer.invoke(`${GPTV}:run`, directory, options),
	handleRunWd14: async (directory: string) => ipcRenderer.invoke(`${WD14}:run`, directory),
	send(channel: string, value?: unknown) {
		ipcRenderer.send(channel, value);
	},
	on(channel: string, callback: (...arguments_: unknown[]) => void) {
		function subscription(_event: IpcRendererEvent, ...arguments_: unknown[]) {
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
