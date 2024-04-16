import { readFile, writeFile } from "fs/promises";

import { ipcMain } from "electron";
import fetch from "node-fetch";

import { buildKey } from "#/build-key";
import { ID } from "#/enums";
import logger from "@/services/logger";
import { createDirectory } from "@/utils/fs";
import { getCaptainDownloads } from "@/utils/path-helpers";

// Location of the default marketplace data
const defaultMarketplacePath = getCaptainDownloads("marketplace/default.json");

/**
 * Handles requests to fetch marketplace data, either from a remote source or from local cache.
 *
 * If the `download` flag in the payload is true, it attempts to fetch fresh data from the
 * `marketplaceUrl` provided. Upon success, the new data is saved to localhost.
 * If fetching fails, it sends an error message back to the event sender.
 *
 * Whether the download succeeds or fails, or if `download` is false, it attempts to read the
 * marketplace data from the local cache. If reading the cached data fails, it logs this error
 * and sends an error message back to the event sender.
 *
 * @param event - The IPC event object, used to send responses back to the event emitter.
 * @param payload - The payload containing the parameters for the operation:
 *                  - `marketplaceUrl`: The URL from which to fetch marketplace data.
 *                  - `download`: Optional boolean flag indicating whether to download fresh
 *                    data from the remote URL. Defaults to `false`.
 */
ipcMain.on(buildKey([ID.MARKETPLACE], { suffix: ":fetch" }), async (event, payload) => {
	try {
		const { marketplaceUrl, download = false } = payload;

		if (download) {
			const response = await fetch(marketplaceUrl);
			if (!response.ok) {
				throw new Error(`Failed to download the JSON file: ${response.statusText}`);
			}

			const data = await response.json();

			// Make sure that the marketplace folder exists
			createDirectory(getCaptainDownloads("marketplace"));

			// Save the marketplace data
			await writeFile(defaultMarketplacePath, JSON.stringify(data));
		}
	} catch (error) {
		const message = "Error fetching remote marketplace data";
		logger.error(message, error);
		event.sender.send(buildKey([ID.MARKETPLACE], { suffix: ":error" }), message);
	}

	try {
		const data = await readFile(defaultMarketplacePath, { encoding: "utf8" });

		// Send marketplace data to the client
		event.sender.send(buildKey([ID.MARKETPLACE], { suffix: ":data" }), JSON.parse(data));
	} catch (error) {
		const message = "Error reading cached marketplace data";
		logger.error(message, error);
		event.sender.send(buildKey([ID.MARKETPLACE], { suffix: ":error" }), message);
	}
});
