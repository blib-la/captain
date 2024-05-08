import type { SDKMessage } from "@captn/react/types";
import { APP_MESSAGE_KEY } from "@captn/utils/constants";
import type { IpcMainEvent } from "electron";
import { ipcMain } from "electron";

import { PORTS } from "@/electron/constants";
import { ComfyUI } from "@/electron/services/comfyui";
import { buildKey } from "@/shared/build-key";
import { ID } from "@/shared/enums";
import type { NodeChain } from "@/shared/types/comfyui";

ipcMain.on(
	APP_MESSAGE_KEY,
	async <T>(
		event: IpcMainEvent,
		{ message, appId }: { message: SDKMessage<T>; appId: string }
	) => {
		const channel = `${appId}:${APP_MESSAGE_KEY}`;
		console.log({ message, appId });

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

				console.log("freeing comfy????");

				// Add the workflow into the queue
				const wasFreed = await ComfyUI.getInstance.free({ unloadModels, freeMemory });
				console.log("freeing comfy::::", { wasFreed });

				// Send the promptId back to the sender
				event.sender.send(channel, {
					action: "comfyui:wasFreed",
					payload: { wasFreed },
				});

				break;
			}

			case "comfyui:registerClient": {
				// Register the client and receive updates from ComfyUI
				ComfyUI.getInstance.registerClient(appId, data => {
					event.sender.send(channel, {
						action: "comfyui:update",
						payload: { data },
					});
				});

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
