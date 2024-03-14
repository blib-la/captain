import fsp from "node:fs/promises";

import { APP_MESSAGE_KEY } from "@captn/utils/constants";
import { getProperty } from "dot-prop";
import type { IpcMainEvent } from "electron";
import { ipcMain } from "electron";
import type { ExecaChildProcess } from "execa";
import { execa } from "execa";

import { buildKey } from "#/build-key";
import { ID } from "#/enums";
import type { VectorStoreDocument } from "#/types/vector-store";
import { apps } from "@/apps";
import { userStore } from "@/stores";
import {
	getCaptainData,
	getCaptainDownloads,
	getCaptainTemporary,
	getDirectory,
	getUserData,
} from "@/utils/path-helpers";

export interface SDKMessage<T> {
	payload: T;
	action?: string;
}

ipcMain.on(
	APP_MESSAGE_KEY,
	<T>(_event: IpcMainEvent, { message, appId }: { message: SDKMessage<T>; appId: string }) => {
		switch (message.action) {
			case "open": {
				_event.sender.send(`${appId}:${APP_MESSAGE_KEY}`, {
					action: "path",
					payload: getUserData("apps", appId),
				});
				break;
			}

			default: {
				break;
			}
		}
	}
);

let process_: ExecaChildProcess<string> | undefined;
let cache = "";

ipcMain.on(
	APP_MESSAGE_KEY,
	(event, { message, appId }: { message: SDKMessage<string>; appId: string }) => {
		if (message.action !== "livePainting:start") {
			return;
		}

		const channel = `${appId}:${APP_MESSAGE_KEY}`;
		if (process_) {
			event.sender.send(channel, { action: "livePainting:started", payload: true });
			return;
		}

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
						event.sender.send(channel, {
							action: "livePainting:starting",
							payload: true,
						});
					}

					if (process_ && jsonData.status === "started") {
						event.sender.send(channel, {
							action: "livePainting:started",
							payload: true,
						});
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

						event.sender.send(channel, {
							action: "livePainting:stopped",
							payload: true,
						});
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

						event.sender.send(channel, {
							action: "livePainting:generated",
							payload: `data:image/png;base64,${base64Image}`,
						});
					}
				} catch {
					console.log("Received non-JSON data:", dataString);
				}
			});

			process_.stderr.on("livePainting:data", data => {
				console.error(`error: ${data}`);

				event.sender.send(channel, { action: "livePainting:error", payload: data });
			});
		}
	}
);

ipcMain.on(
	APP_MESSAGE_KEY,
	async <T>(_event: IpcMainEvent, { message }: { message: SDKMessage<T>; appId: string }) => {
		switch (message.action) {
			case "livePainting:stop": {
				if (process_ && process_.stdin) {
					process_.stdin.write(JSON.stringify({ command: "shutdown" }) + "\n");
				}

				break;
			}

			case "livePainting:settings": {
				if (process_ && process_.stdin) {
					process_.stdin.write(JSON.stringify(message.payload) + "\n");
				}

				break;
			}

			case "livePainting:dataUrl": {
				try {
					const dataString = message.payload as string;
					const base64Data = dataString.replace(/^data:image\/png;base64,/, "");
					const decodedImageData = Buffer.from(base64Data, "base64");

					await fsp.writeFile(
						getCaptainData("temp/live-painting/input.png"),
						decodedImageData
					);
				} catch (error) {
					console.error(error);
				}

				break;
			}

			default: {
				break;
			}
		}
	}
);

interface FunctionTree {
	[key: string]: FunctionTree | ((properties: Record<string, unknown>) => void);
}

export const functions: FunctionTree = {
	userStore: {
		set(properties: Record<string, unknown>) {
			for (const key in properties) {
				if (Object.hasOwn(properties, key)) {
					userStore.set(key, properties[key]);
				}
			}
		},
	},
};

export function handleCaptainAction(payload: VectorStoreDocument["payload"]) {
	try {
		const { id: functionPath, parameters } = payload;
		const function_ = getProperty(functions, functionPath);
		if (typeof function_ === "function") {
			function_(parameters ?? {});
		}
	} catch (error) {
		console.log(error);
	}
}

ipcMain.on(
	buildKey([ID.CAPTAIN_ACTION]),
	(event, message: { action: string; payload: unknown }) => {
		console.log(message);
		switch (message.action) {
			case "function": {
				handleCaptainAction(message.payload as VectorStoreDocument["payload"]);
				if (apps.prompt) {
					apps.prompt.blur();
				}

				break;
			}

			default: {
				break;
			}
		}
	}
);
