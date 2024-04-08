import fsp from "node:fs/promises";

import { APP_MESSAGE_KEY } from "@captn/utils/constants";
import type { IpcMainEvent } from "electron";
import { ipcMain } from "electron";
import type { ExecaChildProcess } from "execa";
import { execa } from "execa";

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
	async (event, { message, appId }: { message: SDKMessage<string>; appId: string }) => {
		if (message.action !== "text-to-image:start") {
			return;
		}

		createDirectory(getCaptainTemporary("text-to-image"));

		const channel = `${appId}:${APP_MESSAGE_KEY}`;
		if (process_) {
			event.sender.send(channel, { action: "text-to-image:started", payload: true });
			logger.info(`text-to-image: started`);
			return;
		}

		const pythonBinaryPath = getCaptainData("python-embedded/python.exe");
		const scriptPath = getDirectory("python/stable-diffusion/text-to-image/main.py");
		const outputFile = getCaptainTemporary("text-to-image/output.png");
		const scriptArguments = [
			"--model_path",
			getCaptainDownloads(
				"stable-diffusion/checkpoints/stabilityai/sdxl/sd_xl_base_1.0_0.9vae.safetensors"
			),
			"--vae_path",
			getCaptainDownloads("stable-diffusion/vae/madebyollin/vae-fix"),
			"--model_type",
			"stable-diffusion-xl",
			"--output_image_path",
			outputFile,
			"--disable_stablefast",
			"--debug",
		];

		process_ = execa(pythonBinaryPath, ["-u", scriptPath, ...scriptArguments]);

		if (process_.stdout && process_.stderr) {
			logger.info(`text-to-image: processing data`);
			process_.stdout.on("data", async data => {
				const dataString = data.toString();

				try {
					const jsonData = JSON.parse(dataString);

					console.log(`text-to-image: ${JSON.stringify(jsonData)}`);

					if (process_ && jsonData.status === "starting") {
						event.sender.send(channel, {
							action: "text-to-image:starting",
							payload: true,
						});
					}

					if (process_ && jsonData.status === "started") {
						event.sender.send(channel, {
							action: "text-to-image:started",
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
							action: "text-to-image:stopped",
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
							action: "text-to-image:generated",
							payload: `data:image/png;base64,${base64Image}`,
						});
					}
				} catch {
					logger.info(`text-to-image: Received non-JSON data: ${dataString}`);
					console.log("Received non-JSON data:", dataString);
				}
			});

			logger.info(`text-to-image: processing stderr`);
			process_.stderr.on("text-to-image:data", data => {
				console.error(`error: ${data}`);

				logger.info(`text-to-image: error: ${data}`);

				event.sender.send(channel, { action: "text-to-image:error", payload: data });
			});
		}
	}
);

ipcMain.on(
	APP_MESSAGE_KEY,
	async <T>(_event: IpcMainEvent, { message }: { message: SDKMessage<T>; appId: string }) => {
		switch (message.action) {
			case "text-to-image:stop": {
				if (process_ && process_.stdin) {
					process_.stdin.write(JSON.stringify({ command: "shutdown" }) + "\n");
				}

				break;
			}

			case "text-to-image:settings": {
				if (process_ && process_.stdin) {
					process_.stdin.write(JSON.stringify(message.payload) + "\n");
				}

				break;
			}

			default: {
				break;
			}
		}
	}
);
