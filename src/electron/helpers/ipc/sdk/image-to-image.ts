import fsp from "node:fs/promises";

import { APP_MESSAGE_KEY } from "@captn/utils/constants";
import type { IpcMainEvent } from "electron";
import { ipcMain } from "electron";
import type { ExecaChildProcess } from "execa";
import { execa } from "execa";

import { cleanPath } from "#/string";
import logger from "@/services/logger";
import { createDirectory } from "@/utils/fs";
import {
	getCaptainData,
	getCaptainDownloads,
	getCaptainTemporary,
	getDirectory,
} from "@/utils/path-helpers";

export interface SDKMessage<T> {
	payload: T;
	action?: string;
}

let process_: ExecaChildProcess<string> | undefined;
let cache = "";

ipcMain.on(
	APP_MESSAGE_KEY,
	async (
		event,
		{
			message,
			appId,
		}: {
			message: SDKMessage<{
				stablefast?: boolean;
				appId: string;
				vae?: string;
				model?: string;
			}>;
			appId: string;
		}
	) => {
		if (message.action !== "image-to-image:start") {
			return;
		}

		const {
			model = "stabilityai/sd-turbo/fp16",
			vae = "madebyollin/taesd",
			stablefast,
		} = message.payload;

		createDirectory(getCaptainTemporary("image-to-image"));
		await fsp.writeFile(
			getCaptainTemporary("image-to-image/input.png"),
			"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4//8/AwAI/AL+p5qgoAAAAABJRU5ErkJggg==",
			"base64"
		);

		const channel = `${appId}:${APP_MESSAGE_KEY}`;
		if (process_) {
			event.sender.send(channel, { action: "image-to-image:started", payload: true });
			logger.info(`image-to-image: started`);
			return;
		}

		const pythonBinaryPath = getCaptainData("python-embedded/python.exe");
		const scriptPath = getDirectory("python/stable-diffusion/image-to-image/main.py");
		const outputFile = getCaptainTemporary("image-to-image/output.png");
		const scriptArguments = [
			"--model_path",
			getCaptainDownloads("stable-diffusion/checkpoints", cleanPath(model)),
			"--vae_path",
			getCaptainDownloads("stable-diffusion/vae", cleanPath(vae)),
			"--input_image_path",
			getCaptainTemporary("image-to-image/input.png"),
			"--output_image_path",
			outputFile,
			"--debug",
		];

		if (!stablefast) {
			scriptArguments.push("--disable_stablefast");
		}

		process_ = execa(pythonBinaryPath, ["-u", scriptPath, ...scriptArguments]);

		if (process_.stdout && process_.stderr) {
			logger.info(`image-to-image: processing data`);
			process_.stdout.on("data", async data => {
				const dataString = data.toString();

				try {
					const jsonData = JSON.parse(dataString);

					console.log(`image-to-image: ${JSON.stringify(jsonData)}`);

					if (process_ && jsonData.status === "starting") {
						event.sender.send(channel, {
							action: "image-to-image:starting",
							payload: true,
						});
					}

					if (process_ && jsonData.status === "started") {
						event.sender.send(channel, {
							action: "image-to-image:started",
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
							action: "image-to-image:stopped",
							payload: true,
						});
					}

					if (jsonData.status === "image_generated") {
						const imageData = await fsp.readFile(outputFile);
						const base64Image = imageData.toString("base64");

						if (!base64Image.trim()) {
							return;
						}

						if (base64Image.trim() === cache) {
							return;
						}

						cache = base64Image;

						event.sender.send(channel, {
							action: "image-to-image:generated",
							payload: `data:image/png;base64,${base64Image}`,
						});
					}
				} catch {
					logger.info(`image-to-image: Received non-JSON data: ${dataString}`);
					console.log("Received non-JSON data:", dataString);
				}
			});

			logger.info(`image-to-image: processing stderr`);
			process_.stderr.on("image-to-image:data", data => {
				console.error(`error: ${data}`);

				logger.info(`image-to-image: error: ${data}`);

				event.sender.send(channel, { action: "image-to-image:error", payload: data });
			});
		}
	}
);

ipcMain.on(
	APP_MESSAGE_KEY,
	async <T>(_event: IpcMainEvent, { message }: { message: SDKMessage<T>; appId: string }) => {
		switch (message.action) {
			case "image-to-image:stop": {
				if (process_ && process_.stdin) {
					process_.stdin.write(JSON.stringify({ command: "shutdown" }) + "\n");
				}

				break;
			}

			case "image-to-image:settings": {
				if (process_ && process_.stdin) {
					process_.stdin.write(JSON.stringify(message.payload) + "\n");
				}

				break;
			}

			case "image-to-image:dataUrl": {
				try {
					const dataString = message.payload as string;
					const base64Data = dataString.replace(/^data:image\/png;base64,/, "");
					const decodedImageData = Buffer.from(base64Data, "base64");

					await fsp.writeFile(
						getCaptainTemporary("image-to-image/input.png"),
						decodedImageData
					);
				} catch (error) {
					console.error(error);
				}

				break;
			}

			case "image-to-image:imageBuffer": {
				try {
					const { buffer } = message.payload as any;

					await fsp.writeFile(getCaptainTemporary("image-to-image/input.png"), buffer);
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
