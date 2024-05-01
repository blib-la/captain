import axios from "axios";
import { app, ipcMain } from "electron";

import { logger } from "@/electron/services/logger";
import { marketplaceStore } from "@/electron/stores";
import { buildKey } from "@/shared/build-key";
import { ID } from "@/shared/enums";

ipcMain.handle(
	buildKey([ID.MARKETPLACE], { suffix: ":fetch" }),
	async (_event, { url, download }) => {
		if (!download) {
			return marketplaceStore.store;
		}

		try {
			const { data } = await axios.get(url);
			marketplaceStore.store = data;
			return data;
		} catch (error) {
			const message = "Error fetching remote marketplace data";
			logger.error(message, error);
			throw new Error(message);
		}
	}
);

ipcMain.on(buildKey([ID.APP], { suffix: "restart" }), async () => {
	app.relaunch();
	app.quit();
});
