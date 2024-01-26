import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";
import {
  BLIP,
  CAPTION,
  DATASET,
  DATASETS,
  DIRECTORY,
  EXISTING_PROJECT,
  FEEDBACK,
  GPTV,
  IMAGE_CACHE,
  LOCALE,
  PROJECT,
  PROJECTS,
  STORE,
  WD14,
} from "./helpers/constants";
import { Project } from "./helpers/types";
import { Except } from "type-fest";

const handler = {
  store: (data: Record<string, unknown>) =>
    ipcRenderer.invoke(`${STORE}:set`, data),
  sendFeedback: (data: { body: string }) =>
    ipcRenderer.invoke(`${FEEDBACK}:send`, data),
  saveCaption: (imageData: {
    caption: string;
    image: string;
    captionFile: string;
  }) => ipcRenderer.invoke(`${CAPTION}:save`, imageData),
  getDirectory: () => ipcRenderer.invoke(`${DIRECTORY}:get`),
  getLocale: () => ipcRenderer.invoke(`${LOCALE}:get`),
  createImageCache: (directory: string, name: string) =>
    ipcRenderer.invoke(`${IMAGE_CACHE}:create`, directory, name),
  getExistingProject: (project: {
    id: string;
    cover?: string;
    name: string;
    source: string;
  }) => ipcRenderer.invoke(`${EXISTING_PROJECT}:get`, project),
  getProjects: () => ipcRenderer.invoke(`${PROJECTS}:get`),
  getDatasets: () => ipcRenderer.invoke(`${DATASETS}:get`),
  getDataset: (id: string) => ipcRenderer.invoke(`${DATASET}:get`, id),
  updateDataset: (id: string, data: Partial<Except<Project, "id">>) =>
    ipcRenderer.invoke(`${DATASET}:update`, id, data),
  deleteDataset: (id: string) => ipcRenderer.invoke(`${DATASET}:delete`, id),
  deleteProject: (id: string) => ipcRenderer.invoke(`${PROJECT}:delete`, id),
  handleRunBlip: async (directory: string) =>
    ipcRenderer.invoke(`${BLIP}:run`, directory),
  handleRunGPTV: async (
    directory: string,
    options: {
      exampleResponse: string;
      guidelines: string;
      batchSize?: number;
    },
  ) => ipcRenderer.invoke(`${GPTV}:run`, directory, options),
  handleRunWd14: async (directory: string) =>
    ipcRenderer.invoke(`${WD14}:run`, directory),
  send(channel: string, value?: unknown) {
    ipcRenderer.send(channel, value);
  },
  on(channel: string, callback: (...args: unknown[]) => void) {
    const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
      callback(...args);
    ipcRenderer.on(channel, subscription);

    return () => {
      ipcRenderer.removeListener(channel, subscription);
    };
  },
};

contextBridge.exposeInMainWorld("ipc", handler);

export type IpcHandler = typeof handler;
