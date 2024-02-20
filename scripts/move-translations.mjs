import fsp from "fs/promises";

import { globby } from "globby";

// Add keys to be moved
const keys = [];
const originFile = "common.json";
const targetFile = "labels.json";

const pattern = `src/client/public/locales/*/${originFile}`;

try {
	const paths = await globby(pattern, { absolute: true });
	console.log(paths);

	for (const filePath of paths) {
		const targetFilePath = filePath.replace(originFile, targetFile);
		console.log(`copy keys from ${filePath} to ${targetFilePath}`);
		fsp.readFile(filePath, "utf8")
			.then(content => JSON.parse(content))
			.then(json => {
				const partial = {};
				for (const key of keys) {
					partial[key] = json[key];
				}

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
