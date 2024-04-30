import { ipcMain } from "electron";

import { buildKey } from "#/build-key";
import { ID } from "#/enums";
import { logger } from "@/services/logger";
import { checkCoreUpdates, downloadCoreUpdate, restartAndInstall } from "@/utils/update";

ipcMain.on(buildKey([ID.UPDATE], { suffix: ":check" }), async () => {
	logger.info("checking for Captain update");
	await checkCoreUpdates();
});

ipcMain.on(buildKey([ID.UPDATE], { suffix: ":download" }), async () => {
	logger.info("downloading Captain update");
	await downloadCoreUpdate();
});

ipcMain.on(buildKey([ID.UPDATE], { suffix: ":install" }), () => {
	logger.info("installing Captain update");
	restartAndInstall();
});
