import fsp from "node:fs/promises";
import path from "node:path";

import { USER_LANGUAGE_KEY } from "@captn/utils/constants";
import { ipcMain } from "electron";

import { logError, logger } from "@/electron/services/logger";
import { VectorStore } from "@/electron/services/vector-store";
import { keyStore, userStore } from "@/electron/stores";
import { sendToAllWindows } from "@/electron/stores/watchers";
import { clone, lfs } from "@/electron/utils/git";
import { getCaptainData } from "@/electron/utils/path-helpers";
import { readFilesRecursively } from "@/electron/utils/read-files-recursively";
import { buildKey } from "@/shared/build-key";
import { VECTOR_STORE_COLLECTION } from "@/shared/constants";
import { ID } from "@/shared/enums";

ipcMain.on(USER_LANGUAGE_KEY, (_event, language) => {
	userStore.set("language", language);
});

ipcMain.on(buildKey([ID.KEYS], { suffix: ":set-openAiApiKey" }), (_event, openAiApiKey) => {
	keyStore.set("openAiApiKey", openAiApiKey);
	sendToAllWindows("hasOpenAiApiKey", Boolean(keyStore.get("openAiApiKey")));
});

ipcMain.on(buildKey([ID.KEYS], { suffix: ":set-anthropicApiKey" }), (_event, anthropicApiKey) => {
	keyStore.set("anthropicApiKey", anthropicApiKey);
	sendToAllWindows("hasAnthropicApiKey", Boolean(keyStore.get("anthropicApiKey")));
});

ipcMain.on(
	buildKey([ID.KEYS], { suffix: ":set-googleGenerativeAiApiKey" }),
	(_event, googleGenerativeAiApiKey) => {
		keyStore.set("googleGenerativeAiApiKey", googleGenerativeAiApiKey);
		sendToAllWindows(
			"hasGoogleGenerativeAiApiKey",
			Boolean(keyStore.get("googleGenerativeAiApiKey"))
		);
	}
);

ipcMain.on(buildKey([ID.KEYS], { suffix: ":set-mistralApiKey" }), (_event, mistralApiKey) => {
	keyStore.set("mistralApiKey", mistralApiKey);
	sendToAllWindows("hasMistralApiKey", Boolean(keyStore.get("mistralApiKey")));
});

ipcMain.on(buildKey([ID.KEYS], { suffix: ":get-openAiApiKey" }), event => {
	const openAiApiKey = keyStore.get("openAiApiKey");
	event.sender.send(buildKey([ID.KEYS], { suffix: ":openAiApiKey" }), openAiApiKey);
});

ipcMain.on(buildKey([ID.KEYS], { suffix: ":get-anthropicApiKey" }), event => {
	const anthropicApiKey = keyStore.get("anthropicApiKey");
	event.sender.send(buildKey([ID.KEYS], { suffix: ":anthropicApiKey" }), anthropicApiKey);
});

ipcMain.on(buildKey([ID.KEYS], { suffix: ":get-googleGenerativeAiApiKey" }), event => {
	const googleGenerativeAiApiKey = keyStore.get("googleGenerativeAiApiKey");
	event.sender.send(
		buildKey([ID.KEYS], { suffix: ":googleGenerativeAiApiKey" }),
		googleGenerativeAiApiKey
	);
});

ipcMain.on(buildKey([ID.KEYS], { suffix: ":get-mistralApiKey" }), event => {
	const mistralApiKey = keyStore.get("mistralApiKey");
	event.sender.send(buildKey([ID.KEYS], { suffix: ":mistralApiKey" }), mistralApiKey);
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

ipcMain.on(buildKey([ID.FILE], { suffix: ":delete-forever" }), async (event, { id, filePath }) => {
	try {
		logger.log(`deleting ${id}`);
		const instance = VectorStore.getInstance;
		await instance.delete(VECTOR_STORE_COLLECTION, id);
		await fsp.rm(filePath);
		event.sender.send(buildKey([ID.FILE], { suffix: ":delete-forever" }), true);
		logger.log(`deleted ${id}`);
	} catch (error) {
		logError(error);
		event.sender.send(buildKey([ID.FILE], { suffix: ":delete-error" }), {
			error: `Could not delete ${id}`,
		});
	}
});
