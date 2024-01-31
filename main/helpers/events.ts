import fsp from "fs/promises";
import path from "path";

import { BrowserWindow, ipcMain, shell } from "electron";
import { download } from "electron-dl";
import { v4 } from "uuid";

import package_ from "../../package.json";

import { runBlip, runGPTV, runWd14 } from "./caption";
import {
	APP,
	BLIP,
	CAPTION,
	DATASET,
	EXISTING_PROJECT,
	FEEDBACK,
	FETCH,
	FOLDER,
	GPTV,
	IMAGE_CACHE,
	LOCALE,
	MARKETPLACE_INDEX,
	MODEL,
	MODELS,
	PROJECT,
	PROJECTS,
	STABLE_DIFFUSION_SETTINGS,
	STORE,
	WD14,
} from "./constants";
import { store } from "./store";
import type { Project } from "./types";
import {
	createMarketplace,
	createMinifiedImageCache,
	getUserData,
	openNewGitHubIssue,
} from "./utils";

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
ipcMain.handle(`${PROJECTS}:get`, async (): Promise<Project[]> => {
	const projectsDirectory = getUserData("projects");

	try {
		const files = await fsp.readdir(projectsDirectory);
		const projects = await Promise.all(
			files.map(async (file): Promise<null | Project> => {
				// For each file or directory, determine if it's a directory (a project).
				const projectPath = path.join(projectsDirectory, file);
				const stat = await fsp.stat(projectPath);
				if (stat.isDirectory()) {
					// If it's a directory, attempt to read the project configuration file.
					const configPath = path.join(projectPath, "project.json");
					try {
						const projectConfig = await fsp.readFile(configPath, "utf8");
						return JSON.parse(projectConfig) as Project;
					} catch {
						return null;
					}
				} else {
					return null;
				}
			})
		);

		return projects.filter(Boolean) as Project[];
	} catch (error) {
		console.error("Error fetching projects:", error);
		// In case of an error, return an empty array.
		return [];
	}
});

// Handler to fetch image files for a given project.
ipcMain.handle(`${EXISTING_PROJECT}:get`, async (_event, project: Project) => {
	const filesDirectory = getUserData("projects", project.id, "files");
	const sourceDirectory = project.source;
	const files = await fsp.readdir(filesDirectory);
	const images = files.filter(file => /\.(jpg|jpeg|png)$/i.test(file));

	return Promise.all(
		images.map(async image => {
			let caption = "";
			const captionFile = path
				.join(sourceDirectory, image)
				.replace(/\.(jpg|jpeg|png)$/i, ".txt");
			try {
				caption = await fsp.readFile(captionFile, "utf8");
			} catch (error) {
				console.log(error);
			}

			return {
				image: path.join(filesDirectory, image),
				captionFile,
				caption,
			};
		})
	);
});

// Handler to create an image cache for a directory.
ipcMain.handle(`${IMAGE_CACHE}:create`, async (_event, directory: string, name: string) => {
	const files = await fsp.readdir(directory);
	const images = files.filter(file => /\.(jpg|jpeg|png)$/i.test(file));
	// Generate a unique ID for the cache directory.
	const id = v4();
	const outDirectory = getUserData("projects", id);
	const outFilesDirectory = getUserData("projects", id, "files");
	await fsp.mkdir(outFilesDirectory, { recursive: true });

	const projectConfiguration: Project = {
		id,
		name,
		files: outFilesDirectory,
		cover: images[0],
		source: directory,
	};

	await fsp.writeFile(
		path.join(outDirectory, "project.json"),
		JSON.stringify(projectConfiguration, null, 2)
	);

	// Process and cache each image file.
	return {
		config: projectConfiguration,
		images: await Promise.all(
			images.map(async image => {
				let caption = "";
				const captionFile = path
					.join(directory, image)
					.replace(/\.(jpg|jpeg|png)$/i, ".txt");
				try {
					caption = await fsp.readFile(captionFile, "utf8");
				} catch (error) {
					console.log(error);
				}

				return {
					image: await createMinifiedImageCache(
						path.join(directory, image),
						path.join(outFilesDirectory, image)
					),
					captionFile,
					caption,
				};
			})
		),
	};
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

ipcMain.handle(`${PROJECT}:delete`, async (_event, id: string) => {
	const directory = getUserData("projects", id);
	await fsp.rm(directory, { recursive: true, force: true });
});

ipcMain.handle(`${DATASET}:get`, async (_event, id: string) => {
	const datasetConfig = getUserData("projects", id, "project.json");
	const filesDirectory = getUserData("projects", id, "files");
	const dataset = await fsp.readFile(datasetConfig, "utf8").then(content => JSON.parse(content));
	const sourceDirectory = dataset.source;
	const files = await fsp.readdir(filesDirectory);
	const images = files.filter(file => /\.(jpg|jpeg|png)$/i.test(file));

	return {
		dataset,
		images: await Promise.all(
			images.map(async image => {
				let caption = "";
				const captionFile = path
					.join(sourceDirectory, image)
					.replace(/\.(jpg|jpeg|png)$/i, ".txt");
				try {
					caption = await fsp.readFile(captionFile, "utf8");
				} catch {
					// Console.log(error);
				}

				return {
					image: path.join(filesDirectory, image),
					captionFile,
					caption,
				};
			})
		),
	};
});

ipcMain.handle(`${DATASET}:delete`, async (_event, id: string) => {
	const directory = getUserData("projects", id);
	await fsp.rm(directory, { recursive: true, force: true });
});

ipcMain.handle(
	`${DATASET}:update`,
	async (event, id: string, partial: Partial<Exclude<Project, "id">>) => {
		const dataset = getUserData("projects", id, "project.json");
		const project = await fsp
			.readFile(dataset, "utf8")
			.then(content => JSON.parse(content) as Project);

		await fsp.writeFile(dataset, JSON.stringify({ ...project, ...partial, id }, null, 2));
	}
);

// Handler to get the latest marketplace data
ipcMain.handle(`${MARKETPLACE_INDEX}:download`, async (event, gitRepository: string) => {
	await createMarketplace(gitRepository);
});

// Handler to save caption values to the file
ipcMain.handle(
	`${CAPTION}:save`,
	async (event, imageData: { captionFile: string; caption: string }) => {
		await fsp.writeFile(imageData.captionFile, imageData.caption.trim());
	}
);

// Handler to execute the BLIP image captioning service.
ipcMain.handle(`${BLIP}:run`, async (_event, directory: string) => runBlip(directory));

// Handler to execute the WD14 image tagging service.
ipcMain.handle(`${WD14}:run`, async (_event, directory: string) => runWd14(directory));

// Handler to execute the GPT-Vision (GPTV) service.
ipcMain.handle(
	`${GPTV}:run`,
	async (
		_event,
		directory: string,
		options: {
			batchSize?: number;
			exampleResponse: string;
			guidelines: string;
		}
	) => runGPTV(directory, options)
);
