import { ipcMain } from "electron";

import { logger } from "@/electron/services/logger";
import { checkCoreUpdates, downloadCoreUpdate, restartAndInstall } from "@/electron/utils/update";
import { buildKey } from "@/shared/build-key";
import { ID } from "@/shared/enums";

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
