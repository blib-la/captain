import type { SDKMessage } from "@captn/react/types";
import { APP_MESSAGE_KEY } from "@captn/utils/constants";
import type { IpcMainEvent } from "electron";
import { ipcMain } from "electron";

import { ComfyUI } from "@/electron/services/comfyui";
import type { NodeChain } from "@/shared/types/comfyui";

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
