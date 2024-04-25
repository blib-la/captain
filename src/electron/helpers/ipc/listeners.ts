import fsp from "node:fs/promises";
import path from "node:path";

import { ipcMain } from "electron";

import { buildKey } from "#/build-key";
import { ID } from "#/enums";
import { keyStore, userStore } from "@/stores";
import { sendToAllWindows } from "@/stores/watchers";
import { clone, lfs } from "@/utils/git";
import { getCaptainData } from "@/utils/path-helpers";
import { readFilesRecursively } from "@/utils/read-files-recursively";

ipcMain.on(buildKey([ID.USER], { suffix: ":language" }), (_event, language) => {
	userStore.set("language", language);
});

ipcMain.on(buildKey([ID.KEYS], { suffix: ":set-openAiApiKey" }), (_event, openAiApiKey) => {
	keyStore.set("openAiApiKey", openAiApiKey);
	sendToAllWindows("hasOpenAiApiKey", Boolean(keyStore.get("openAiApiKey")));
});

ipcMain.on(buildKey([ID.KEYS], { suffix: ":get-openAiApiKey" }), event => {
	const openAiApiKey = keyStore.get("openAiApiKey");
	event.sender.send(buildKey([ID.KEYS], { suffix: ":openAiApiKey" }), openAiApiKey);
});

ipcMain.on(buildKey([ID.DOWNLOADS], { suffix: ":clone" }), async (_event, data) => {
	const { repository, destination } = data;

	try {
		await lfs();

		await clone(repository, destination, {
			onProgress(progress) {
				_event.sender.send(buildKey([ID.DOWNLOADS], { suffix: ":progress" }), progress);
			},
			onCompleted(completed) {
				_event.sender.send(buildKey([ID.DOWNLOADS], { suffix: ":cloned" }), completed);
			},
		});
	} catch (error) {
		_event.sender.send(buildKey([ID.DOWNLOADS], { suffix: ":error" }), error);
	}
});

ipcMain.on(
	buildKey([ID.STORY], { suffix: ":get-all" }),
	async (event, { fileTypes }: { fileTypes?: string[] }) => {
		const files = await readFilesRecursively(getCaptainData("files/stories"), { fileTypes });
		const fileContents = await Promise.all(
			files.map(async file => ({
				content: await fsp.readFile(path.join(file.path, file.name), { encoding: "utf8" }),
				path: file.path,
				name: file.name,
			}))
		);
		const parsedFiles = fileContents
			.map(({ content, path: path_, name }) => {
				const json = JSON.parse(content);

				return {
					json,
					path: path_,
					name,
				};
			})
			.map(({ json: { id, locale, title, createdAt, updatedAt }, path: path_, name }) => ({
				id,
				locale,
				title,
				createdAt,
				updatedAt,
				path: path.join(path_, name),
				cover: path.join(path_, "1.png"),
			}));
		event.sender.send(buildKey([ID.STORY], { suffix: ":all" }), parsedFiles);
	}
);
