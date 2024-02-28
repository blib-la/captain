import fsp from "fs/promises";

import { globby } from "globby";

// Add keys to be moved
const keys = [];
const originFile = "labels.json";
const targetFile = "texts.json";
const move = false;

const pattern = `src/client/public/locales/*/${originFile}`;

try {
	const paths = await globby(pattern);
	console.log(paths);

	for (const filePathEntry of paths) {
		const filePath = filePathEntry.toString();
		const targetFilePath = filePath.replace(originFile, targetFile);
		console.log(`${move ? "move" : "copy"} keys from ${filePath} to ${targetFilePath}`);
		fsp.readFile(filePath, "utf8")
			.then(content => JSON.parse(content))
			.then(async json => {
				const partial = {};
				for (const key of keys) {
					partial[key] = json[key];
					json[key] = undefined;
				}

				await fsp.writeFile(filePath, JSON.stringify(json, null, 2));

				return partial;
			})
			.then(async partial => {
				fsp.readFile(targetFilePath, "utf8")
					.then(content => JSON.parse(content))
					.then(json => ({
						...json,
						...partial,
					}))
					.then(json => {
						fsp.writeFile(targetFilePath, JSON.stringify(json, null, 2));
					});
			});
	}
} catch (error) {
	console.error("Error moving JSON keys:", error);
}
