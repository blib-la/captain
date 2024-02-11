import fsp from "fs/promises";
import path from "path";

import { BrowserWindow, ipcMain, shell } from "electron";
import { download } from "electron-dl";

import package_ from "../../package.json";
import { gpt, handleFiles } from "../captions";

import { runBlip, runWd14 } from "./caption";
import {
	APP,
	BLIP,
	CAPTION,
	CAPTION_RUNNING,
	DATASET,
	DATASETS,
	FEEDBACK,
	FETCH,
	FOLDER,
	GPTV,
	LOCALE,
	MARKETPLACE_INDEX,
	MODEL,
	MODELS,
	STABLE_DIFFUSION_SETTINGS,
	STORE,
	WD14,
} from "./constants";
import { store } from "./store";
import type { Dataset } from "./types";
import { createMarketplace, getUserData, openNewGitHubIssue } from "./utils";

// Handling the 'STORE:set' channel for setting multiple values in the store asynchronously.
ipcMain.handle(`${STORE}:set`, async (event, state: Record<string, unknown>) => {
	for (const key in state) {
		if (Object.hasOwn(state, key)) {
			store.set(key, state[key]);
		}
	}
});

ipcMain.handle(`${LOCALE}:get`, async () => store.get(LOCALE));

ipcMain.handle(`${FETCH}:get`, async (event, key: string) => store.get(key));
ipcMain.handle(`${FETCH}:delete`, async (event, key: string) => store.delete(key));
ipcMain.handle(`${FETCH}:post`, async (event, key: string, data: Record<string, unknown>) =>
	store.set(key, data)
);

ipcMain.handle(
	`${FETCH}:patch`,
	async (event, key: string, partialData: Record<string, unknown>) => {
		const previousData = (await store.get(key)) as Record<string, unknown>;
		return store.set(key, { ...previousData, ...partialData });
	}
);

ipcMain.on(`${FOLDER}:open`, (event, path) => {
	shell.openPath(path);
});

ipcMain.on(`${APP}:close`, () => {
	const window_ = BrowserWindow.getFocusedWindow();
	if (window_) {
		window_.close();
	}
});

ipcMain.on(`${APP}:minimize`, () => {
	const window_ = BrowserWindow.getFocusedWindow();
	if (window_) {
		window_.minimize();
	}
});

ipcMain.on(`${APP}:maximize`, () => {
	const window_ = BrowserWindow.getFocusedWindow();
	if (!window_) {
		return;
	}

	if (window_.isMaximized()) {
		window_.unmaximize();
	} else {
		window_.maximize();
	}
});

ipcMain.handle(
	`${MODEL}:download`,
	async (_event, type: string, url: string, { storeKey }: { id: string; storeKey: string }) => {
		const window_ = BrowserWindow.getFocusedWindow();
		if (!window_) {
			return;
		}

		const settings = store.get(STABLE_DIFFUSION_SETTINGS) as {
			checkpoints: string;
			loras: string;
		};
		store.set(storeKey, true);
		console.log({ storeKey });
		try {
			const directory = settings[`${type}s` as keyof typeof settings];
			console.log("START DOWNLOADING >>>", type, "from:", url, ", to:", directory);
			await download(window_, url, { directory });
			console.log("DONE DOWNLOADING", type, url, directory);
		} catch (error) {
			console.log(error);
		} finally {
			store.set(storeKey, false);
		}
	}
);

async function readFilesRecursively(directory: string) {
	let files: string[] = [];
	const items = await fsp.readdir(directory, { withFileTypes: true });

	for (const item of items) {
		const fullPath = path.join(directory, item.name);
		if (item.isDirectory()) {
			files = [...files, ...(await readFilesRecursively(fullPath))];
		} else {
			files.push(item.name);
		}
	}

	return files;
}

ipcMain.handle(`${MODELS}:get`, async (_event, type: string) => {
	const settings = store.get(STABLE_DIFFUSION_SETTINGS) as {
		checkpoints: string;
		loras: string;
	};
	try {
		const directory = settings[`${type}s` as keyof typeof settings];
		return readFilesRecursively(directory);
	} catch (error) {
		console.log(error);
		return [];
	}
});

// Handler to fetch project details from the 'projects' directory.
ipcMain.handle(`${DATASETS}:get`, async (): Promise<Dataset[]> => {
	const projectsDirectory = path.join(getUserData("Captain_Data"), "datasets");

	try {
		const files = await fsp.readdir(projectsDirectory);
		const projects = await Promise.all(
			files.map(async (file): Promise<null | Dataset> => {
				// For each file or directory, determine if it's a directory (a project).
				const projectPath = path.join(projectsDirectory, file);
				const stat = await fsp.stat(projectPath);
				if (stat.isDirectory()) {
					// If it's a directory, attempt to read the project configuration file.
					const configPath = path.join(projectPath, "config.json");
					try {
						const projectConfig = await fsp.readFile(configPath, "utf8");
						return JSON.parse(projectConfig) as Dataset;
					} catch {
						return null;
					}
				} else {
					return null;
				}
			})
		);

		return projects.filter(Boolean) as Dataset[];
	} catch (error) {
		console.error("Error fetching projects:", error);
		// In case of an error, return an empty array.
		return [];
	}
});

// Handler to send feedback to GitHub
ipcMain.handle(
	`${FEEDBACK}:send`,
	async (
		event,
		{
			body,
		}: {
			body: string;
		}
	) => {
		openNewGitHubIssue({
			body: `${body}


----

Version: ${package_.version}
`,
			user: "blib-la",
			repo: "captain",
			labels: ["app-feedback"],
		});
	}
);

// Handler to get the latest marketplace data
ipcMain.handle(`${MARKETPLACE_INDEX}:download`, async (event, gitRepository: string) => {
	const window_ = BrowserWindow.getFocusedWindow();
	if (!window_) {
		return;
	}

	await createMarketplace(gitRepository);
	window_.webContents.send(`${MARKETPLACE_INDEX}:updated`, true);
});

// Handler to execute the BLIP image captioning service.
ipcMain.handle(`${BLIP}:run`, async (_event, directory: string) => runBlip(directory));

// Handler to execute the WD14 image tagging service.
ipcMain.handle(`${WD14}:run`, async (_event, directory: string) => runWd14(directory));

/// ////  NEW SHIT

// Handler to execute the GPT-Vision (GPTV) service.
ipcMain.handle(
	`${GPTV}:run`,
	async (
		_event,
		files: string[],
		options: {
			batchSize?: number;
			exampleResponse: string;
			instructions: string;
		}
	) => {
		const window_ = BrowserWindow.getFocusedWindow();
		if (!window_) {
			return;
		}

		store.set(CAPTION_RUNNING, true);
		handleFiles(files, {
			batchSize: 4,
			onProgress({ counter, totalCount }) {
				window_.webContents.send(`${CAPTION}:updated`, {
					progress: counter / totalCount,
					counter,
					totalCount,
				});
			},
			onDone() {
				console.log("--- DONE ---");
				store.set(CAPTION_RUNNING, false);
			},
			handler: gpt,
			options,
		});
	}
);

ipcMain.handle(
	`${DATASET}:update`,
	async (event, id: string, partial: Partial<Exclude<Dataset, "id">>) => {
		const dataset = getUserData("Captain_Data", "datasets", id, "config.json");
		const project = await fsp
			.readFile(dataset, "utf8")
			.then(content => JSON.parse(content) as Dataset);

		await fsp.writeFile(dataset, JSON.stringify({ ...project, ...partial, id }, null, 2));
	}
);

ipcMain.handle(`${DATASET}:get`, async (_event, id: string) => {
	const datasetConfig = getUserData("Captain_Data", "datasets", id, "config.json");
	// TODO We need error handling here
	const dataset = await fsp
		.readFile(datasetConfig, "utf8")
		.then(content => JSON.parse(content) as Dataset);
	const { files, servedFiles } = dataset;
	const datasetFiles = await fsp.readdir(files);
	const imageFiles = datasetFiles.filter(file => file.endsWith(".png"));

	return {
		dataset,
		images: await Promise.all(
			imageFiles.map(async imageFile => {
				let caption = "";
				const captionFile = imageFile.replace(/\.png/, ".txt");
				const servedImageFile = imageFile.replace(/\.png/, ".jpg");
				try {
					caption = await fsp.readFile(path.join(files, captionFile), "utf8");
				} catch (error) {
					if (error instanceof Error) {
						console.log(error.message);
					}
				} finally {
					console.log(caption);
				}

				return {
					files,
					servedFiles,
					image: path.join(servedFiles, servedImageFile),
					imageFile,
					servedImageFile,
					captionFile,
					caption,
				};
			})
		),
	};
});

// Handler to save caption values to the file
ipcMain.handle(
	`${CAPTION}:save`,
	async (event, imageData: { captionFile: string; caption: string; files: string }) => {
		console.log({ imageData });
		await fsp.writeFile(
			path.join(imageData.files, imageData.captionFile),
			imageData.caption.trim()
		);
	}
);
