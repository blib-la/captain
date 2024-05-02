import { ipcMain } from "electron";

import { keyStore } from "@/electron/stores";

ipcMain.on("hasOpenAiApiKey", event => {
	event.sender.send("hasOpenAiApiKey", Boolean(keyStore.get("openAiApiKey")));
});
