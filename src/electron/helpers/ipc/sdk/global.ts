import type { SDKMessage } from "@captn/react/types";
import { APP_MESSAGE_KEY, DownloadState } from "@captn/utils/constants";
import type { VectorStoreDocument } from "@captn/utils/types";
import type { IpcMainEvent } from "electron";
import { ipcMain } from "electron";
import type ElectronStore from "electron-store";

import { apps } from "@/electron/apps";
import { logError, logger } from "@/electron/services/logger";
import { downloadsStore, inventoryStore } from "@/electron/stores";
import { pushToStore } from "@/electron/stores/utils";
import { handleCaptainAction } from "@/electron/utils/captain-action";
import { clone } from "@/electron/utils/git";
import { getCaptainDownloads, getUserData } from "@/electron/utils/path-helpers";
import { buildKey } from "@/shared/build-key";
import { ID } from "@/shared/enums";

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

ipcMain.on(
	APP_MESSAGE_KEY,
	async <T>(_event: IpcMainEvent, { message }: { message: SDKMessage<T>; appId: string }) => {
		switch (message.action) {
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

								pushToStore(
									inventoryStore as unknown as ElectronStore<
										Record<string, unknown>
									>,
									keyPath,
									{
										id: repository,
										modelPath: getCaptainDownloads(destination, repository),
										label,
									}
								);

								downloadsStore.delete(repository);
							},
						})
					);

					try {
						await Promise.all(promises);
					} catch (error) {
						// TODO: add "onError" into "clone" to properly catch the error
						logError(error);
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
		logger.info(message);
		switch (message.action) {
			case "function": {
				try {
					handleCaptainAction(message.payload as VectorStoreDocument["payload"]);
				} catch (error) {
					logError(error);
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
