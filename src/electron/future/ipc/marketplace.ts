import { readFile, writeFile } from "fs/promises";

import { ipcMain } from "electron";
import fetch from "node-fetch";
import { v4 } from "uuid";

import { buildKey } from "#/build-key";
import { ID } from "#/enums";
import logger from "@/services/logger";
import { createDirectory } from "@/utils/fs";
import { getCaptainDownloads } from "@/utils/path-helpers";

// Location of the default marketplace data
const defaultMarketplacePath = getCaptainDownloads("marketplace/default.json");

const mockedResponse = {
	items: [
		{
			id: v4(),
			payload: {
				type: "model",
				description: "Turbocharged version of Stable Diffusion.",
				author: "Stability AI",
				link: "https://huggingface.co/stabilityai/sd-turbo",
				license: "sai-nc-community",
				thumbnail: "https://placehold.co/300x300?text=SD+Turbo",
				architecture: "sd-2-1-turbo",
				download: {
					id: "stabilityai/sd-turbo",
					label: "SD Turbo",
					source: "https://blibla-captain-assets.s3.eu-central-1.amazonaws.com/python-embedded-win.7z",
					destination: "stable-diffusion/checkpoints",
					unzip: true,
				},
			},
		},
		{
			id: v4(),
			payload: {
				type: "app",
				description: "Generate live visuals.",
				author: "Blibla",
				link: "https://github.com/blib-la/vj",
				license: "AGPLv3.0",
				thumbnail: "https://placehold.co/300x300?text=VJ",
				download: {
					id: "blib-la/vj",
					label: "VJ App",
					source: "https://blibla-captain-assets.s3.eu-central-1.amazonaws.com/python-embedded-win.7z",
					destination: "apps/blib-la/vj",
					unzip: true,
				},
			},
		},
		{
			id: v4(),
			payload: {
				type: "lora",
				description: "Lora model inspired by Eugène Atget's photography.",
				author: "Blibla",
				link: "https://huggingface.co/Blib-la/eugene_atget_lora_sdxl",
				license: "cc-by-nc-4.0",
				thumbnail: "https://placehold.co/300x300?text=Eugène+Atget",
				architecture: "sd-xl-1-0",
				download: {
					id: "blibla/eugene_atget_lora_sdxl",
					label: "Eugène Atget",
					source: "https://blibla-captain-assets.s3.eu-central-1.amazonaws.com/python-embedded-win.7z",
					destination: "stable-diffusion/lora/blibla/eugene_atget_lora_sdxl",
					unzip: true,
				},
			},
		},
	],
};

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

			// TODO: Use this instead of the mockedResponse
			const jsonData = await response.json();

			// Make sure that the marketplace folder exists
			createDirectory(getCaptainDownloads("marketplace"));

			await writeFile(defaultMarketplacePath, JSON.stringify(mockedResponse));
		}
	} catch (error) {
		const message = "Error fetching remote marketplace data";
		logger.error(message, error);
		event.sender.send(buildKey([ID.MARKETPLACE], { suffix: ":error" }), message);
	}

	try {
		// Send marketplace data to the client
		const jsonData = await readFile(defaultMarketplacePath, { encoding: "utf8" });
		event.sender.send(buildKey([ID.MARKETPLACE], { suffix: ":data" }), JSON.parse(jsonData));
	} catch (error) {
		const message = "Error reading cached marketplace data";
		logger.error(message, error);
		event.sender.send(buildKey([ID.MARKETPLACE], { suffix: ":error" }), message);
	}
});
