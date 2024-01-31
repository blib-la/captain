import fsp from "fs/promises";
import path from "path";

import exifr from "exifr";
import fse from "fs-extra";
import JSON5 from "json5";
import sharp from "sharp";

import { captainDataPath } from "./utils";

type JsonStructure = Record<string, any>;

export async function createJsonStructure(basePath: string): Promise<JsonStructure> {
	const topLevelStructure: JsonStructure = {};
	console.log({ basePath });

	async function constructStructure(currentPath: string, object: JsonStructure) {
		const items = await fsp.readdir(currentPath);

		const id = path.basename(currentPath);

		for (const item of items) {
			const fullPath = path.join(currentPath, item);
			const stats = await fse.stat(fullPath);

			if (stats.isDirectory()) {
				const itemKey = item;
				object[item] = {};
				await constructStructure(fullPath, object[itemKey]);
			} else if (stats.isFile()) {
				const fileExtension = path.extname(fullPath).toLowerCase();
				if ([".json", ".json5"].includes(fileExtension)) {
					const fileContents = await fsp.readFile(fullPath, "utf8");
					const parsedJson = JSON5.parse(fileContents);
					const fileNameKey = path.basename(item, fileExtension);
					object[fileNameKey] = parsedJson;
					object.id = id;
				} else if ([".jpg", ".jpeg", ".png"].includes(fileExtension)) {
					const imageBuffer = await fsp.readFile(fullPath);
					const exifData = await exifr.parse(imageBuffer);
					const resizedImageBuffer = await sharp(imageBuffer)
						.resize(512, 512)
						.jpeg({ quality: 70, progressive: true })
						.toBuffer();

					const indexPath = path.join(captainDataPath, "index");
					const previewPath = path.join(indexPath, `${id}.jpg`);
					object.preview = previewPath;
					object.meta = exifData;
					await fsp.mkdir(indexPath, { recursive: true });
					await fsp.writeFile(previewPath, resizedImageBuffer);
				}
			}
		}
	}

	const topLevelDirectories = await fse.readdir(basePath);
	for (const directory of topLevelDirectories) {
		const fullPath = path.join(basePath, directory);
		const stat = await fse.stat(fullPath);
		if (stat.isDirectory()) {
			topLevelStructure[directory] = {};
			await constructStructure(fullPath, topLevelStructure[directory]);
		}
	}

	return topLevelStructure;
}

// Usage
