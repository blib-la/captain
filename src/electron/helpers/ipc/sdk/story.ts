import console from "node:console";

import type { SDKMessage } from "@captn/react/types";
import { APP_MESSAGE_KEY } from "@captn/utils/constants";
import { ipcMain, type IpcMainEvent } from "electron";
import type { Except } from "type-fest";

import { logError, logger } from "@/electron/services/logger";
import { captionImages, createStory, maxTokenMap } from "@/electron/story";
import type { StoryRequest } from "@/shared/types/story";

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
						logger.error("missing descriptions");

						return;
					}

					// Debugging helper to check how the images were captioned
					// Use native log here as this is only useful while developing
					console.log(imageDescriptions);

					const maxTokens = maxTokenMap[options.length] * images.length;
					const channel = `${appId}:${APP_MESSAGE_KEY}`;

					await createStory(
						{ imageDescriptions, maxTokens, locale, options },
						{
							onError(error) {
								logError(error);
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
