import { app, Menu, Tray } from "electron";

import { getDirectory } from "@/utils/path-helpers";
import { openApp, openCore } from "@/windows";

export const contextMenu = Menu.buildFromTemplate([
	{
		label: "Quit Captain",
		type: "normal",
		click() {
			app.quit();
		},
	},
	{
		label: "Open Dashboard",
		type: "normal",
		click() {
			openCore("dashboard");
		},
	},
	{
		label: "Open Downloads",
		type: "normal",
		click() {
			openCore("downloads");
		},
	},
	{
		label: "Open Settings",
		type: "normal",
		click() {
			openCore("settings");
		},
	},
	{
		label: "Open Explorer",
		type: "normal",
		click() {
			openApp("explorer");
		},
	},
]);

export function createTray() {
	const tray = new Tray(getDirectory("icon.png"));

	tray.setToolTip("Captain");
	tray.setContextMenu(contextMenu);
	return tray;
}
