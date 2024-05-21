import type { OpenAIProvider } from "@ai-sdk/openai";
import { createOpenAI } from "@ai-sdk/openai";
import type { SDKMessage } from "@captn/react/types";
import { APP_MESSAGE_KEY } from "@captn/utils/constants";
import type { CoreMessage } from "ai";
import { streamText } from "ai";
import { ipcMain, type IpcMainEvent } from "electron";
import Store from "electron-store";
import { v4 } from "uuid";

import { keyStore } from "@/electron/stores";

const openAIAPiKey = keyStore.get("openAiApiKey");

let openai: OpenAIProvider | null = openAIAPiKey ? createOpenAI({ apiKey: openAIAPiKey }) : null;

export const openAIStore = new Store<Record<string, CoreMessage[]>>({
	name: "OPENAI_HISTORY",
});

ipcMain.on(
	APP_MESSAGE_KEY,
	async (
		event: IpcMainEvent,
		{ message, appId }: { message: SDKMessage<{ input: string }>; appId: string }
	) => {
		const channel = `${appId}:${APP_MESSAGE_KEY}`;
		let messages = openAIStore.get(appId, []);

		switch (message.action) {
			case "openai:clear": {
				messages = [];
				openAIStore.set(appId, messages);
				event.sender.send(channel, {
					action: "openai:messages",
					payload: { messages },
				});
				break;
			}

			case "openai:history": {
				event.sender.send(channel, {
					action: "openai:messages",
					payload: { messages: messages.map(message => ({ ...message, id: v4() })) },
				});
				break;
			}

			case "openai:chat": {
				try {
					openai ??= createOpenAI({ apiKey: keyStore.get("openAiApiKey") });
					const userInput = message.payload.input;

					messages.push({ role: "user" as const, content: userInput });
					openAIStore.set(appId, messages);

					// Only send the last 10 messages
					const limit = 10;
					const limitedHistory = messages.slice(-limit);

					const result = await streamText({
						model: openai("gpt-3.5-turbo"),
						system: `You are a helpful, respectful and honest assistant.`,
						messages: limitedHistory,
					});

					let fullResponse = "";
					for await (const delta of result.textStream) {
						fullResponse += delta;
						event.sender.send(channel, {
							action: "openai:response",
							payload: { output: fullResponse, done: false },
						});
					}

					messages.push({ role: "assistant", content: fullResponse });
					openAIStore.set(appId, messages);
					event.sender.send(channel, {
						action: "openai:response",
						payload: { output: fullResponse, done: true },
					});
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
