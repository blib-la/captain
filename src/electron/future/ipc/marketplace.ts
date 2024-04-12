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
 * Update the marketplace data in the client
 *
 * @param event
 */
async function updateData(event: any) {
	try {
		const jsonData = await readFile(defaultMarketplacePath, { encoding: "utf8" });
		event.sender.send(buildKey([ID.MARKETPLACE], { suffix: ":data" }), JSON.parse(jsonData));
	} catch {
		logger.error("Error reading cached marketplace data");
	}
}

/**
 * Provide cached marketplace data
 */
ipcMain.on(buildKey([ID.MARKETPLACE], { suffix: ":cached" }), async event => {
	updateData(event);
});

/**
 * Download marketplace data from remote source
 */
ipcMain.on(buildKey([ID.MARKETPLACE], { suffix: ":download" }), async (event, payload) => {
	try {
		const { marketplaceUrl } = payload;

		const response = await fetch(marketplaceUrl);
		if (!response.ok) {
			throw new Error(`Failed to download the JSON file: ${response.statusText}`);
		}

		// TODO: Use this instead of the mockedResponse
		const jsonData = await response.json();

		// Make sure that the marketplace folder exists
		createDirectory(getCaptainDownloads("marketplace"));

		await writeFile(defaultMarketplacePath, JSON.stringify(mockedResponse));

		// Send marketplace data to the client
		updateData(event);
	} catch {
		event.sender.send(
			buildKey([ID.MARKETPLACE], { suffix: ":error" }),
			"Error downloading marketplace data"
		);
	}
});
