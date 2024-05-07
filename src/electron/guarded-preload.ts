import { contextBridge } from "electron";

contextBridge.exposeInMainWorld("ipc", {});
