import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";
import {
  BLIP,
  CAPTION,
  DIRECTORY,
  EXISTING_PROJECT,
  GPTV,
  IMAGE_CACHE,
  PROJECTS,
  STORE,
  WD14,
} from "./helpers/constants";

const handler = {
  store: (data: Record<string, unknown>) =>
    ipcRenderer.invoke(`${STORE}:set`, data),
  saveCaption: (imageData: {
    caption: string;
    image: string;
    captionFile: string;
  }) => ipcRenderer.invoke(`${CAPTION}:save`, imageData),
  getDirectory: () => ipcRenderer.invoke(`${DIRECTORY}:get`),
  createImageCache: (directory: string, name: string) =>
    ipcRenderer.invoke(`${IMAGE_CACHE}:create`, directory, name),
  getExistingProject: (project: {
    id: string;
    cover?: string;
    name: string;
    source: string;
  }) => ipcRenderer.invoke(`${EXISTING_PROJECT}:get`, project),
  getProjects: () => ipcRenderer.invoke(`${PROJECTS}:get`),
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
