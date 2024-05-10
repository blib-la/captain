import { Buffer } from "node:buffer";

import type { SDKMessage } from "@captn/react/types";
import { APP_MESSAGE_KEY } from "@captn/utils/constants";
import axios from "axios";
import type { IpcMainEvent } from "electron";
import { ipcMain } from "electron";

import { PORTS } from "@/electron/constants";
import { ComfyUI } from "@/electron/services/comfyui";
import { logger } from "@/electron/services/logger";
import { getCaptainFiles, getComfyUIPath } from "@/electron/utils/path-helpers";
import { buildKey } from "@/shared/build-key";
import { ID } from "@/shared/enums";
import type { NodeChain } from "@/shared/types/comfyui";

/**
 * Converts a data URL to a Node.js Buffer.
 * @param dataUrl The data URL to convert.
 * @returns A Buffer containing the binary data.
 */
function dataURLToBuffer(dataUrl: string): Buffer {
	// Check if the URL is valid and split the content type and data
	const matches = dataUrl.match(/^data:(.+);base64,(.*)$/);
	if (!matches || matches.length !== 3) {
		throw new Error("Invalid data URL.");
	}

	const base64Data = matches[2];
	return Buffer.from(base64Data, "base64");
}

ipcMain.on(
	APP_MESSAGE_KEY,
	async <T>(
		event: IpcMainEvent,
		{ message, appId }: { message: SDKMessage<T>; appId: string }
	) => {
		const channel = `${appId}:${APP_MESSAGE_KEY}`;

		switch (message.action) {
			case "comfyui:queue": {
				const { workflow } = message.payload as { workflow: NodeChain };

				// Add the workflow into the queue
				const { promptId } = await ComfyUI.getInstance.queueWorkflow(workflow, appId);

				// Send the promptId back to the sender
				event.sender.send(channel, {
					action: "comfyui:promptId",
					payload: { promptId },
				});

				break;
			}

			case "comfyui:free": {
				const { unloadModels, freeMemory } = message.payload as {
					unloadModels?: boolean;
					freeMemory?: boolean;
				};

				// Add the workflow into the queue
				const wasFreed = await ComfyUI.getInstance.free({ unloadModels, freeMemory });

				// Send the promptId back to the sender
				event.sender.send(channel, {
					action: "comfyui:wasFreed",
					payload: { wasFreed },
				});

				break;
			}

			case "comfyui:registerClient": {
				logger.info(`ComfyUI received register request from ${appId}`);
				// Register the client and receive updates from ComfyUI
				ComfyUI.getInstance.registerClient(appId, data => {
					event.sender.send(channel, {
						action: "comfyui:update",
						payload: { data },
					});
				});

				break;
			}

			case "comfyui:upload-image": {
				const { fileName, dataURL } = message.payload as {
					fileName: string;
					dataURL: string;
				};

				try {
					const blob = new Blob([dataURLToBuffer(dataURL)]);

					const formData = new FormData();

					formData.append("image", blob, fileName);

					formData.append("overwrite", "true");

					// Now, make the POST request to the upload/image endpoint
					await axios.post(`http://127.0.0.1:${PORTS.COMFYUI}/upload/image`, formData);
				} catch (error) {
					console.log(error);
				}

				break;
			}

			default: {
				break;
			}
		}
	}
);

ipcMain.on(buildKey([ID.COMFYUI_PORT], { suffix: ":get" }), event => {
	event.sender.send(buildKey([ID.COMFYUI_PORT], { suffix: ":get" }), PORTS.COMFYUI.toString());
});

ipcMain.on(buildKey([ID.COMFYUI], { suffix: ":get-path" }), event => {
	event.sender.send(buildKey([ID.COMFYUI], { suffix: ":path" }), {
		comfyUIFiles: getCaptainFiles("comfyui"),
		temporary: getComfyUIPath("temp"),
	});
});
