import fsp from "node:fs/promises";
import path from "path";

import { BrowserWindow, ipcMain } from "electron";

import { CAPTION, CAPTION_RUNNING, CAPTIONS, GPTV, WD14 } from "../helpers/constants";
import { store } from "../helpers/store";
import type { DatasetEntry } from "../helpers/types";

import type { CaptionOptions } from "./misc";
import { gpt, handleFiles, wd14 } from "./misc";

export function runCaptions<T extends CaptionOptions>(
	files: string[],
	handler: (
		batch: { base64: string; filePath: string }[],
		options: T
	) => Promise<{ filePath: string; caption: string }[]>,
	{ batchSize = 4, parallel = false, ...options }: T
) {
	const window_ = BrowserWindow.getFocusedWindow();
	if (!window_) {
		return;
	}

	store.set(CAPTION_RUNNING, true);
	return handleFiles(files, {
		batchSize,
		parallel,
		async onProgress({ counter, totalCount, descriptions, done }) {
			try {
				for (const description of descriptions) {
					const { filePath, caption } = description;
					// TODO We need a safer handling here
					const captionPath = filePath
						.replaceAll("\\", "/")
						.replace("/serve/", "/files/")
						.replace(/\.jpg$/, ".txt");
					await fsp.writeFile(captionPath, caption);
				}
			} catch (error) {
				if (error instanceof Error) {
					store.set(CAPTION_RUNNING, false);
					console.log(error.message);
				}
			}

			window_.webContents.send(`${CAPTION}:updated`, {
				progress: counter / totalCount,
				counter,
				totalCount,
				done,
			});
		},
		onDone() {
			console.log("--- DONE ---");
			store.set(CAPTION_RUNNING, false);
		},
		handler,
		options,
	});
}

// Handler to execute the GPT-Vision (GPTV) service.
ipcMain.handle(
	`${WD14}:run`,
	async (
		_event,
		files: string[],
		options: {
			batchSize?: number;
			model: string;
			exclude: string[];
		}
	) => runCaptions(files, wd14, options)
);

ipcMain.handle(
	`${GPTV}:run`,
	async (
		_event,
		files: string[],
		options: {
			batchSize?: number;
			exampleResponse: string[];
			instructions: string;
			parallel?: boolean;
		}
	) => runCaptions(files, gpt, options)
);

ipcMain.handle(`${CAPTIONS}:runBatch`, async (_event, images: DatasetEntry[]) => {
	await Promise.all(
		images.map(image => {
			const captionFile = path.join(image.files, image.captionFile);
			return fsp.writeFile(captionFile, image.caption);
		})
	);
});
