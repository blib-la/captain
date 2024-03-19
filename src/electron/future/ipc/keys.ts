import { ipcMain } from "electron";

import { keyStore } from "@/stores";

ipcMain.on("hasOpenAiApiKey", event => {
	event.sender.send("openAiApiKey", Boolean(keyStore.get("openAiApiKey")));
});
