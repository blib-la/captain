import { ipcMain } from "electron";

import { buildKey } from "#/build-key";
import { ID } from "#/enums";
import { checkCoreUpdates, downloadCoreUpdate, restartAndInstall } from "@/utils/update";

ipcMain.on(buildKey([ID.UPDATE], { suffix: ":search" }), async () => {
	await checkCoreUpdates();
});

ipcMain.on(buildKey([ID.UPDATE], { suffix: ":download" }), async () => {
	await downloadCoreUpdate();
});

ipcMain.on(buildKey([ID.UPDATE], { suffix: ":install" }), () => {
	restartAndInstall();
});
