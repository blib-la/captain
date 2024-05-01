import axios from "axios";
import { app, ipcMain } from "electron";

import { buildKey } from "#/build-key";
import { ID } from "#/enums";
import { logger } from "@/services/logger";
import { marketplaceStore } from "@/stores";

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
