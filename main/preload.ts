import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";

const handler = {
  store: <T>(data: { property: string; value: T }) =>
    ipcRenderer.invoke("store", data),
  selectFolder: () => ipcRenderer.invoke("dialog:openDirectory"),
  showContent: (directory: string) =>
    ipcRenderer.invoke("showContent", directory),
  handleRunBlip: async (directory: string) =>
    ipcRenderer.invoke("run-blip", directory),
  handleRunGPTV: async (
    directory: string,
    options: {
      exampleResponse: string;
      systemMessage: string;
      batchSize: number;
    },
  ) => ipcRenderer.invoke("run-gpt-v", directory, options),
  handleRunWd14: async (directory: string) =>
    ipcRenderer.invoke("run-wd14", directory),
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
