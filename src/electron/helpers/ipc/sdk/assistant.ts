import type { AnthropicProvider } from "@ai-sdk/anthropic";
import { createAnthropic } from "@ai-sdk/anthropic";
import type { GoogleGenerativeAIProvider } from "@ai-sdk/google";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { MistralProvider } from "@ai-sdk/mistral";
import { createMistral } from "@ai-sdk/mistral";
import type { OpenAIProvider } from "@ai-sdk/openai";
import { createOpenAI } from "@ai-sdk/openai";
import type { SDKMessage } from "@captn/react/types";
import { APP_MESSAGE_KEY } from "@captn/utils/constants";
import { streamText } from "ai";
import { ipcMain, type IpcMainEvent } from "electron";
import Store from "electron-store";
import type { Except } from "type-fest";
import { v4 } from "uuid";

import { logError } from "@/electron/services/logger";
import { keyStore } from "@/electron/stores";
import { buildKey } from "@/shared/build-key";
import { KEY } from "@/shared/enums";
import type { ChatModel } from "@/shared/types/openai";

export const assistantStore = new Store<Record<string, ChatModel>>({
	name: buildKey([KEY.STORE, KEY.ASSISTANT]),
});

ipcMain.on(
	APP_MESSAGE_KEY,
	async (
		event: IpcMainEvent,
		{
			message,
			appId,
		}: {
			message: SDKMessage<{
				input?: string;
				model?: string;
				maxHistory?: number;
				id: string;
				update?: Partial<Except<ChatModel, "messages">>;
			}>;
			appId: string;
		}
	) => {
		if (!message.action.startsWith("assistant:")) {
			return;
		}

		const channel = `${appId}:${APP_MESSAGE_KEY}`;
		const chatId = message.payload.id;
		let chat = assistantStore.get(chatId, {
			label: "New Chat",
			messages: [],
			model: "gpt-3.5-turbo",
		});

		switch (message.action) {
			// Update the data of achat. Allows partial objects
			case "assistant:update": {
				try {
					const { update } = message.payload;
					chat = { ...chat, ...update };
					assistantStore.set(chatId, chat);
					const chats = Object.entries(assistantStore.store).map(([id, value]) => ({
						id,
						label: value.label,
						pinned: value.pinned,
						favorite: value.favorite,
					}));
					event.sender.send(channel, {
						action: "assistant:chats",
						payload: {
							chats,
						},
					});
				} catch (error) {
					logError(error);
					event.sender.send(channel, {
						action: "assistant:error",
						payload: { error: error instanceof Error ? error.message : String(error) },
					});
				}

				break;
			}

			// Delete a chat from the store
			case "assistant:delete": {
				chat = { label: "New Chat", messages: [], model: "gpt-3.5-turbo" };
				assistantStore.delete(chatId);
				try {
					const chats = Object.entries(assistantStore.store).map(([id, value]) => ({
						id,
						label: value.label,
						pinned: value.pinned,
						favorite: value.favorite,
					}));
					event.sender.send(channel, {
						action: "assistant:chats",
						payload: {
							chats,
						},
					});
				} catch (error) {
					logError(error);
					event.sender.send(channel, {
						action: "assistant:error",
						payload: { error: error instanceof Error ? error.message : String(error) },
					});
				}

				break;
			}

			// Get the entire history of chats and the currently selected chat
			// The list of all chats does not include their messages
			case "assistant:history": {
				event.sender.send(channel, {
					action: "assistant:messages",
					payload: {
						chat: {
							...chat,
							messages: chat.messages.map(message => ({ ...message, id: v4() })),
						},
					},
				});
				try {
					const chats = Object.entries(assistantStore.store).map(([id, value]) => ({
						id,
						label: value.label,
						pinned: value.pinned,
						favorite: value.favorite,
					}));
					event.sender.send(channel, {
						action: "assistant:chats",
						payload: {
							chats,
						},
					});
				} catch (error) {
					logError(error);
					event.sender.send(channel, {
						action: "assistant:error",
						payload: { error: error instanceof Error ? error.message : String(error) },
					});
				}

				break;
			}

			// Send an input and trigger a chat generation
			case "assistant:chat": {
				try {
					let assistant:
						| OpenAIProvider
						| AnthropicProvider
						| GoogleGenerativeAIProvider
						| MistralProvider;

					const userInput = message.payload.input!;
					const model = message.payload.model ?? "gpt-3.5-turbo";
					const [modelPrefix] = model.split("-");
					switch (modelPrefix) {
						case "gpt": {
							assistant = createOpenAI({ apiKey: keyStore.get("openAiApiKey") });
							break;
						}

						case "claude": {
							assistant = createAnthropic({
								apiKey: keyStore.get("anthropicApiKey"),
							});
							break;
						}

						case "mistral": {
							assistant = createMistral({
								apiKey: keyStore.get("mistralApiKey"),
							});
							break;
						}

						case "models/gemini": {
							assistant = createGoogleGenerativeAI({
								apiKey: keyStore.get("googleGenerativeAiApiKey"),
							});
							break;
						}

						default: {
							return;
						}
					}

					chat.messages.push({ role: "user" as const, content: userInput });
					chat.model = model;
					assistantStore.set(chatId, chat);

					// Only send the last N messages
					const limit = message.payload.maxHistory ?? 10;
					const limitedHistory = chat.messages.slice(-limit);

					const result = await streamText({
						model: assistant(model),
						system: `You are a best friend: extremely honest, always helpful, and ready to offer candid advice. You are supportive and trustworthy, but your honesty can make you a bit nagging and annoying from time to time. Despite this, you keep things fun and lively, always maintaining a friendly and straightforward attitude.`,
						messages: limitedHistory,
					});

					let fullResponse = "";
					for await (const delta of result.textStream) {
						fullResponse += delta;
						event.sender.send(channel, {
							action: "assistant:response",
							payload: { output: fullResponse, done: false },
						});
					}

					chat.messages.push({ role: "assistant", content: fullResponse, model });
					assistantStore.set(chatId, chat);
					event.sender.send(channel, {
						action: "assistant:response",
						payload: { output: fullResponse, done: true, model },
					});
				} catch (error) {
					logError(error);

					event.sender.send(channel, {
						action: "assistant:error",
						payload: { error: error instanceof Error ? error.message : String(error) },
					});
				}

				break;
			}

			default: {
				break;
			}
		}
	}
);
