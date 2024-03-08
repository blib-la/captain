import { contextBridge } from "electron";

import { handlers } from "./handlers";

contextBridge.exposeInMainWorld("ipc", { ...handlers });
