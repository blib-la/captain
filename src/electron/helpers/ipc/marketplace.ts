import axios from "axios";
import { ipcMain } from "electron";

import { buildKey } from "#/build-key";
import { ID } from "#/enums";
import logger from "@/services/logger";
import { marketplaceStore } from "@/stores";

ipcMain.handle(
	buildKey([ID.MARKETPLACE], { suffix: ":fetch" }),
	async (event, { url, download }) => {
		if (!download) {
			return marketplaceStore.store;
		}

		try {
			const { data } = await axios.get(url);
			console.log("data", data);
			marketplaceStore.store = data;
			return data;
		} catch (error) {
			const message = "Error fetching remote marketplace data";
			logger.error(message, error);
			throw new Error(message);
		}
	}
);
