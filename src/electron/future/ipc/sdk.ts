import { APP_MESSAGE_KEY } from "@captn/utils/constants";
import type { IpcMainEvent } from "electron";
import { ipcMain } from "electron";

import { getUserData } from "@/utils/path-helpers";

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
