import fsp from "fs/promises";
import path from "path";

import { ipcMain } from "electron";
import { v4 } from "uuid";

import { createImageCache } from "../captions";
import { DATASET } from "../helpers/constants";
import type { Dataset } from "../helpers/types";
import { getUserData } from "../helpers/utils";

ipcMain.handle(`${DATASET}:delete`, async (_event, id: string) => {
	const directory = getUserData("Captain_Data", "datasets", id);
	await fsp.rm(directory, { recursive: true, force: true });
});

ipcMain.handle(`${DATASET}:create`, async (_event, directory: string, name: string) => {
	const files = await fsp.readdir(directory);
	const images = files.filter(file => /\.(jpg|jpeg|png)$/i.exec(file));
	// Generate a unique ID for the cache directory.
	const id = v4();
	const outDirectory = getUserData("Captain_Data", "datasets", id);
	const outFilesDirectory = path.join(outDirectory, "files");
	const servedFilesDirectory = path.join(outDirectory, "serve");
	await fsp.mkdir(outFilesDirectory, { recursive: true });
	await fsp.mkdir(servedFilesDirectory, { recursive: true });
	const config: Dataset = {
		id,
		name,
		files: outFilesDirectory,
		servedFiles: servedFilesDirectory,
		cover: "10000.jpg",
		source: directory,
	};

	await fsp.writeFile(path.join(outDirectory, "config.json"), JSON.stringify(config, null, 2));

	return {
		config,
		images: await Promise.all(
			images.map(async (image, index) => {
				let caption = "";

				const fileName = (index + 10_000).toString().padStart(5, "0");
				const servePath = path.join(servedFilesDirectory, `${fileName}.jpg`);
				const filePath = path.join(outFilesDirectory, `${fileName}.png`);
				const captionPath = path.join(outFilesDirectory, `${fileName}.txt`);
				const originalCaptionFile = path
					.join(directory, image)
					.replace(/\.(jpg|jpeg|png)$/i, ".txt");
				try {
					caption = await fsp.readFile(originalCaptionFile, "utf8");
				} catch (error) {
					if (error instanceof Error) {
						console.log(error.message);
					}
				} finally {
					await fsp.writeFile(captionPath, caption);
				}

				await createImageCache(path.join(directory, image), servePath, {
					height: 1536,
					width: 1536,
					type: "jpg",
					quality: 70,
				});
				await createImageCache(path.join(directory, image), filePath, {
					height: 1024,
					width: 1024,
					quality: 100,
					type: "png",
				});

				return {
					image: servePath,
					filePath,
					captionPath,
					caption,
				};
			})
		),
	};
});
