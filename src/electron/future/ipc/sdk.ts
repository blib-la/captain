import fsp from "node:fs/promises";

import { APP_MESSAGE_KEY, DownloadState } from "@captn/utils/constants";
import type { VectorStoreDocument } from "@captn/utils/types";
import { getProperty } from "dot-prop";
import type { IpcMainEvent } from "electron";
import { ipcMain } from "electron";
import type { ExecaChildProcess } from "execa";
import { execa } from "execa";
import type { Except } from "type-fest";

import { buildKey } from "#/build-key";
import { ID } from "#/enums";
import type { StoryRequest } from "#/types/story";
import { apps } from "@/apps";
import { captionImages, createStory, maxTokenMap } from "@/ipc/story";
import logger from "@/services/logger";
import { downloadsStore, inventoryStore, userStore } from "@/stores";
import { pushToStore } from "@/stores/utils";
import { createDirectory } from "@/utils/fs";
import { clone } from "@/utils/git";
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
	async (event, { message, appId }: { message: SDKMessage<string>; appId: string }) => {
		if (message.action !== "livePainting:start") {
			return;
		}

		createDirectory(getCaptainTemporary("live-painting"));

		await fsp.writeFile(
			getCaptainTemporary("live-painting/input.png"),
			"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4//8/AwAI/AL+p5qgoAAAAABJRU5ErkJggg==",
			"base64"
		);

		const channel = `${appId}:${APP_MESSAGE_KEY}`;
		if (process_) {
			event.sender.send(channel, { action: "livePainting:started", payload: true });
			logger.info(`livePainting: started`);
			return;
		}

		const pythonBinaryPath = getCaptainData("python-embedded/python.exe");
		const scriptPath = getDirectory("python/live-painting/main.py");
		const scriptArguments = [
			"--model_path",
			getCaptainDownloads(
				"stable-diffusion/checkpoints/stabilityai/sd-turbo/fp16/sd-turbo-fp16"
			),
			"--vae_path",
			getCaptainDownloads("stable-diffusion/vae/madebyollin/taesd/taesd"),
			"--input_image_path",
			getCaptainTemporary("live-painting/input.png"),
			"--output_image_path",
			getCaptainTemporary("live-painting/output.png"),
			"--disable_stablefast",
			"--debug",
		];

		process_ = execa(pythonBinaryPath, ["-u", scriptPath, ...scriptArguments]);

		if (process_.stdout && process_.stderr) {
			logger.info(`livePainting: processing data`);
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
					logger.info(`livePatinting: Received non-JSON data: ${dataString}`);
					console.log("Received non-JSON data:", dataString);
				}
			});

			logger.info(`livePatinting: processing stderr`);
			process_.stderr.on("livePainting:data", data => {
				console.error(`error: ${data}`);

				logger.info(`livePatinting: error: ${data}`);

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
						getCaptainTemporary("live-painting/input.png"),
						decodedImageData
					);
				} catch (error) {
					console.error(error);
				}

				break;
			}

			case "livePainting:imageBuffer": {
				try {
					const { buffer } = message.payload as any;

					await fsp.writeFile(getCaptainTemporary("live-painting/input.png"), buffer);
				} catch (error) {
					console.error(error);
				}

				break;
			}

			case "cloneRepositories:start": {
				const models = message.payload as {
					repository: string;
					destination: string;
					label: string;
				}[];

				const promises: Promise<void>[] = [];

				for (const model of models) {
					const { repository, destination, label } = model;

					downloadsStore.set(repository, DownloadState.ACTIVE);

					promises.push(
						clone(repository, destination, {
							onCompleted() {
								downloadsStore.set(repository, DownloadState.DONE);

								const keyPath = destination.replaceAll("/", ".");

								pushToStore(inventoryStore, keyPath, {
									id: repository,
									modelPath: getCaptainDownloads(destination, repository),
									label,
								});

								downloadsStore.delete(repository);
							},
						})
					);

					try {
						await Promise.all(promises);
					} catch (error) {
						// TODO: add "onError" into "clone" to properly catch the error
						console.log(error);
					}
				}

				break;
			}

			default: {
				break;
			}
		}
	}
);

ipcMain.on(
	APP_MESSAGE_KEY,
	async <T>(
		event: IpcMainEvent,
		{ message, appId }: { message: SDKMessage<T>; appId: string }
	) => {
		switch (message.action) {
			case "story:create": {
				try {
					const { images, locale, options } = message.payload as Except<
						StoryRequest,
						"imageDescriptions"
					> & { images: string[] };
					const imageDescriptions = await captionImages(images);

					// Seems like no descriptions were generated. Handle as error
					if (!imageDescriptions) {
						console.log("missing descriptions");

						return;
					}

					// Debugging helper to check how the images were captioned
					console.log(imageDescriptions);

					const maxTokens = maxTokenMap[options.length] * images.length;
					const channel = `${appId}:${APP_MESSAGE_KEY}`;

					await createStory(
						{ imageDescriptions, maxTokens, locale, options },
						{
							onError(error) {
								console.log(error);
							},
							onChunk(story) {
								event.sender.send(channel, {
									action: "story:create",
									payload: { story, done: false },
								});
							},
							onDone(story) {
								event.sender.send(channel, {
									action: "story:create",
									payload: { story, done: true },
								});
							},
						}
					);
				} catch {}

				break;
			}

			default: {
				break;
			}
		}
	}
);

/**
 * Defines a tree structure where each key can either be another `FunctionTree` or a function that takes
 * a properties object and performs an action. This structure allows for nested, dynamic function calls.
 */
export interface FunctionTree {
	[key: string]: FunctionTree | ((properties: Record<string, unknown>) => void);
}

/**
 * An implementation of the `FunctionTree` interface to store functions related to user data management.
 * It currently includes a `set` function for updating user store properties.
 */
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

/**
 * Handles actions directed at the `captain` entity by invoking functions specified by a function path within the `functions` tree.
 * The function to be invoked is determined based on the provided `functionPath`, and it is called with the provided `parameters`.
 *
 * @param {Object} payload - An object containing the details of the action to be performed.
 * @param {string} payload.id - The path to the function within the `functions` tree.
 * @param {Record<string, unknown>} payload.parameters - The parameters to be passed to the function.
 */
export function handleCaptainAction({
	id: functionPath,
	parameters,
}: VectorStoreDocument["payload"]) {
	const function_ = getProperty(functions, functionPath);
	if (typeof function_ === "function") {
		function_(parameters ?? {});
	}
}

/**
 * Sets up an IPC listener for `CAPTAIN_ACTION` messages. When a message is received, it attempts to handle
 * the action specified in the message payload. Supported actions include invoking a function defined in the
 * `functions` tree. Errors during function invocation are logged, and the sender window is closed upon completion.
 */
ipcMain.on(
	buildKey([ID.CAPTAIN_ACTION]),
	(event, message: { action: string; payload: unknown }) => {
		// This log statement is crucial for development and debugging purposes. It outputs the content of
		// the incoming message to the console, providing immediate visibility into the action being processed.
		// Retaining this log facilitates a deeper understanding of the action's payload and helps identify
		// potential issues or anomalies in the data structure or content. It's particularly useful for tracking
		// the flow of data and ensuring that the expected actions are triggered correctly within the SDK.
		console.log(message);
		switch (message.action) {
			case "function": {
				try {
					handleCaptainAction(message.payload as VectorStoreDocument["payload"]);
				} catch (error) {
					console.log(error);
				}

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
