import { ipcMain } from "electron";

import { keyStore } from "@/electron/stores";

ipcMain.on("hasOpenAiApiKey", event => {
	event.sender.send("hasOpenAiApiKey", Boolean(keyStore.get("openAiApiKey")));
});

ipcMain.on("hasAnthropicApiKey", event => {
	event.sender.send("hasAnthropicApiKey", Boolean(keyStore.get("anthropicApiKey")));
});

ipcMain.on("hasGoogleGenerativeAiApiKey", event => {
	event.sender.send(
		"hasGoogleGenerativeAiApiKey",
		Boolean(keyStore.get("googleGenerativeAiApiKey"))
	);
});

ipcMain.on("hasMistralApiKey", event => {
	event.sender.send("hasMistralApiKey", Boolean(keyStore.get("mistralApiKey")));
});
