import fsp from "node:fs/promises";
import path from "node:path";

import { BrowserWindow, ipcMain } from "electron";
import { download } from "electron-dl";
import type { ExecaChildProcess } from "execa";
import { execa } from "execa";

import { buildKey } from "#/build-key";
import { DownloadState, ID } from "#/enums";
import { readFilesRecursively } from "@/main";
import { appSettingsStore, keyStore, userStore } from "@/stores";
import { clone } from "@/utils/git";
import {
	getCaptainData,
	getCaptainDownloads,
	getCaptainTemporary,
	getDirectory,
} from "@/utils/path-helpers";
import { unpack } from "@/utils/unpack";

ipcMain.on(buildKey([ID.WINDOW], { suffix: ":close" }), () => {
	const window_ = BrowserWindow.getFocusedWindow();
	if (window_) {
		window_.close();
	}
});

ipcMain.on(buildKey([ID.WINDOW], { suffix: ":minimize" }), () => {
	const window_ = BrowserWindow.getFocusedWindow();
	if (window_) {
		window_.minimize();
	}
});

ipcMain.on(buildKey([ID.WINDOW], { suffix: ":maximize" }), () => {
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

ipcMain.on(buildKey([ID.INSTALL], { suffix: "start" }), async () => {
	const window_ = BrowserWindow.getFocusedWindow();
	if (!window_) {
		return;
	}

	const pythonEmbedded =
		"https://blibla-captain-assets.s3.eu-central-1.amazonaws.com/python-embedded-win.7z";

	try {
		await download(window_, pythonEmbedded, {
			directory: getCaptainDownloads(),

			onStarted() {
				appSettingsStore.set("status", DownloadState.ACTIVE);
				window_.webContents.send(buildKey([ID.INSTALL], { suffix: ":started" }), true);
			},
			onProgress(progress) {
				window_.webContents.send(buildKey([ID.INSTALL], { suffix: ":progress" }), progress);
			},
			onCancel() {
				window_.webContents.send(buildKey([ID.INSTALL], { suffix: ":cancelled" }), true);
				appSettingsStore.set("status", DownloadState.CANCELLED);
			},
			async onCompleted(item) {
				window_.webContents.send(buildKey([ID.INSTALL], { suffix: ":unpacking" }), true);
				appSettingsStore.set("status", DownloadState.UNPACKING);

				const targetPath = getCaptainData("python-embedded");
				await unpack(getDirectory("7zip", "win", "7za.exe"), item.path, targetPath);

				window_.webContents.send(buildKey([ID.INSTALL], { suffix: ":completed" }), true);
				appSettingsStore.set("status", DownloadState.DONE);
			},
		});
	} catch (error) {
		if (error instanceof Error) {
			window_.webContents.send(buildKey([ID.INSTALL], { suffix: ":failed" }), error.message);
			appSettingsStore.set("status", DownloadState.FAILED);
		}
	}
});

ipcMain.on(buildKey([ID.USER], { suffix: ":language" }), (_event, language) => {
	userStore.set("language", language);
});

let process_: ExecaChildProcess<string> | undefined;
let cache = "";

ipcMain.on(buildKey([ID.LIVE_PAINT], { suffix: ":dataUrl" }), async (_event, dataUrl) => {
	const dataString = dataUrl.toString();
	const base64Data = dataString.replace(/^data:image\/png;base64,/, "");
	const decodedImageData = Buffer.from(base64Data, "base64");

	await fsp.writeFile(getCaptainData("temp/live-painting/input.png"), decodedImageData);
});

ipcMain.on(buildKey([ID.LIVE_PAINT], { suffix: ":start" }), () => {
	const window_ = BrowserWindow.getFocusedWindow();
	if (!window_) {
		return;
	}

	if (!process_) {
		const pythonBinaryPath = getCaptainData("python-embedded/python.exe");
		const scriptPath = getDirectory("python/live-painting/main.py");
		const scriptArguments = [
			"--model_path",
			getCaptainDownloads("stable-diffusion/checkpoints/stabilityai/sd-turbo"),
			"--vae_path",
			getCaptainDownloads("stable-diffusion/vae/madebyollin/taesd"),
			"--input_image_path",
			getCaptainTemporary("live-painting/input.png"),
			"--output_image_path",
			getCaptainTemporary("live-painting/output.png"),
			"--disable_stablefast",
			"--debug",
		];

		process_ = execa(pythonBinaryPath, ["-u", scriptPath, ...scriptArguments]);

		if (process_.stdout && process_.stderr) {
			process_.stdout.on("data", async data => {
				const dataString = data.toString();

				try {
					const jsonData = JSON.parse(dataString);

					console.log(`live-painting: ${JSON.stringify(jsonData)}`);

					if (process_ && jsonData.status === "starting") {
						window_.webContents.send(
							buildKey([ID.LIVE_PAINT], { suffix: ":starting" }),
							true
						);
					}

					if (process_ && jsonData.status === "started") {
						window_.webContents.send(
							buildKey([ID.LIVE_PAINT], { suffix: ":started" }),
							true
						);
					}

					if (
						process_ &&
						(jsonData.status === "shutdown" || jsonData.status === "stopped")
					) {
						if (process_) {
							if (process_.stdout) {
								process_.stdout.removeAllListeners("data");
							}

							if (process_.stderr) {
								process_.stderr.removeAllListeners("data");
							}

							if (process_ && !process_.killed) {
								process_.kill();
							}
						}

						process_ = undefined;

						window_.webContents.send(
							buildKey([ID.LIVE_PAINT], { suffix: ":stopped" }),
							true
						);
					}

					if (jsonData.status === "image_generated") {
						const imageData = await fsp.readFile(
							getCaptainData("temp/live-painting/output.png")
						);
						const base64Image = imageData.toString("base64");

						if (!base64Image.trim()) {
							return;
						}

						if (base64Image.trim() === cache) {
							return;
						}

						cache = base64Image;

						window_.webContents.send(
							buildKey([ID.LIVE_PAINT], { suffix: ":generated" }),
							`data:image/png;base64,${base64Image}`
						);
					}
				} catch {
					console.log("Received non-JSON data:", dataString);
				}
			});

			process_.stderr.on("data", data => {
				console.error(`error: ${data}`);

				window_.webContents.send(buildKey([ID.LIVE_PAINT], { suffix: ":error" }), data);
			});
		}
	}
});

ipcMain.on(buildKey([ID.LIVE_PAINT], { suffix: ":stop" }), () => {
	if (process_ && process_.stdin) {
		process_.stdin.write(JSON.stringify({ command: "shutdown" }) + "\n");
	}
});

ipcMain.on(buildKey([ID.LIVE_PAINT], { suffix: ":settings" }), (_event, data) => {
	if (process_ && process_.stdin) {
		process_.stdin.write(JSON.stringify(data) + "\n");
	}
});

ipcMain.on(buildKey([ID.KEYS], { suffix: ":set-openAiApiKey" }), (_event, openAiApiKey) => {
	keyStore.set("openAiApiKey", openAiApiKey);
});

ipcMain.on(buildKey([ID.KEYS], { suffix: ":get-openAiApiKey" }), event => {
	const openAiApiKey = keyStore.get("openAiApiKey");
	event.sender.send(buildKey([ID.KEYS], { suffix: ":openAiApiKey" }), openAiApiKey);
});

ipcMain.on(buildKey([ID.DOWNLOADS], { suffix: ":clone" }), async (_event, data) => {
	const { repository, destination } = data;

	try {
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
				console.log(json);
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

ipcMain.handle(
	buildKey([ID.FILE], { suffix: ":save" }),
	async (_event, name: string, content: string, { encoding }: { encoding?: BufferEncoding }) => {
		const filePath = getCaptainData("files", name);
		const directory = path.parse(filePath).dir;
		await fsp.mkdir(directory, { recursive: true });
		await fsp.writeFile(filePath, content, { encoding });
		return filePath;
	}
);

ipcMain.handle(buildKey([ID.FILE], { suffix: ":read" }), async (_event, name: string) =>
	fsp.readFile(name, { encoding: "utf8" })
);