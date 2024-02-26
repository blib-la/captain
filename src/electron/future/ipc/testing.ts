import { ipcMain } from "electron";

ipcMain.on("test", (event, value) => {
	event.sender.send("test", value);
});
