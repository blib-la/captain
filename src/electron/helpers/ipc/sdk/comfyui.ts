import { Buffer } from "node:buffer";

import type { SDKMessage } from "@captn/react/types";
import { APP_MESSAGE_KEY } from "@captn/utils/constants";
import type { IpcMainEvent } from "electron";
import { ipcMain } from "electron";

import { PORTS } from "@/electron/constants";
import { ComfyUI } from "@/electron/services/comfyui";
import { logError, logger } from "@/electron/services/logger";
import { getCaptainFiles, getComfyUIPath } from "@/electron/utils/path-helpers";
import { buildKey } from "@/shared/build-key";
import { ID } from "@/shared/enums";
import type { NodeChain } from "@/shared/types/comfyui";

/**
 * Converts a data URL to a Node.js Buffer.
 * @param dataUrl The data URL to convert.
 * @returns A Buffer containing the binary data or null.
 */
function dataURLToBuffer(dataUrl: string): Buffer | null {
	// Check if the URL is valid and split the content type and data
	const matches = dataUrl.match(/^data:(.+);base64,(.*)$/);
	if (!matches || matches.length !== 3) {
		return null;
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
				const response = await ComfyUI.getInstance.queueWorkflow(workflow, appId);

				if (response) {
					// Send the promptId back to the sender
					try {
						event.sender.send(channel, {
							action: "comfyui:promptId",
							payload: { promptId: response.promptId },
						});
					} catch (error) {
						logError(error, "comfyui:promptId");
					}
				}

				break;
			}

			case "comfyui:free": {
				const { unloadModels, freeMemory } = message.payload as {
					unloadModels?: boolean;
					freeMemory?: boolean;
				};

				const wasFreed = await ComfyUI.getInstance.free({ unloadModels, freeMemory });
				// The sender might be destroyed if an unload event triggered the action
				try {
					event.sender.send(channel, {
						action: "comfyui:wasFreed",
						payload: { wasFreed },
					});
				} catch (error) {
					console.log(error);
				}

				break;
			}

			case "comfyui:registerClient": {
				logger.info(`ComfyUI received register request from ${appId}`);
				// Register the client and receive updates from ComfyUI
				ComfyUI.getInstance.registerClient(appId, data => {
					try {
						event.sender.send(channel, {
							action: "comfyui:update",
							payload: { data, comfyUITemporaryPath: getComfyUIPath("temp") },
						});
					} catch (error) {
						logError(error, `comfyui:update from: ${appId}`);
					}
				});

				break;
			}

			case "comfyui:unregisterClient": {
				logger.info(`ComfyUI received unregister request from ${appId}`);
				// Unregister the client and receive updates from ComfyUI
				try {
					ComfyUI.getInstance.unregisterClient(appId);
					await ComfyUI.getInstance.free({ unloadModels: true });
				} catch (error) {
					logError(error, `comfyui:unregisterClient from ${appId}`);
				}

				break;
			}

			case "comfyui:upload-image": {
				const { dataURL } = message.payload as {
					fileName: string;
					dataURL: string;
				};

				try {
					const buffer = dataURLToBuffer(dataURL);
					if (buffer) {
						const blob = new Blob([buffer]);

						await ComfyUI.getInstance.uploadImage(appId, blob);
					}
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
