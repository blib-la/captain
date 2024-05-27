import type { AnthropicProvider } from "@ai-sdk/anthropic";
import { createAnthropic } from "@ai-sdk/anthropic";
import type { GoogleGenerativeAIProvider } from "@ai-sdk/google";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { MistralProvider } from "@ai-sdk/mistral";
import { createMistral } from "@ai-sdk/mistral";
import type { OpenAIProvider } from "@ai-sdk/openai";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModelV1 } from "@ai-sdk/provider";
import type { SDKMessage } from "@captn/react/types";
import { APP_MESSAGE_KEY } from "@captn/utils/constants";
import type { VectorStoreDocument } from "@captn/utils/types";
import type { Schemas as QdrantSchemas } from "@qdrant/js-client-rest";
import type { CoreMessage } from "ai";
import { streamText } from "ai";
import { ipcMain, type IpcMainEvent } from "electron";
import Store from "electron-store";
import type { Except } from "type-fest";
import { v4 } from "uuid";

import { logError, logger } from "@/electron/services/logger";
import { VectorStore } from "@/electron/services/vector-store";
import { keyStore } from "@/electron/stores";
import { normalizePath } from "@/electron/utils/normalize-path";
import { getCaptainData } from "@/electron/utils/path-helpers";
import { availableDataTypes } from "@/shared/assistant";
import { buildKey } from "@/shared/build-key";
import { VECTOR_STORE_COLLECTION } from "@/shared/constants";
import { KEY } from "@/shared/enums";
import type { ChatModel, DataTypeItem } from "@/shared/types/assistant";

export const assistantStore = new Store<Record<string, ChatModel>>({
	name: buildKey([KEY.STORE, KEY.ASSISTANT]),
});

interface RAGDocument {
	id: string;
	filePath: string | undefined;
	content: string;
	type: string;
	label: string;
	score: number;
}
function optimizeContext(context: RAGDocument[]) {
	if (context.length === 0) {
		return "\n<!-- NO CONTEXT -->\n";
	}

	let result = "\n<!-- CONTEXT START -->\n";
	for (const entry of context) {
		result += `${context.indexOf(entry) + 1}. ${entry.label}\n  - Type: ${entry.type}\n  - Path: ${entry.filePath}\n  - Score (0-1): ${entry.score.toFixed(2)}\n  - Content: \`\`\`\n${entry.content}\n\`\`\`\n`;
	}

	result += "\n<!-- CONTEXT END -->\n";
	return result;
}

export const PATH_PLACEHOLDER = "c:/users/anon/";

export function cropCaptainData(filePath: string) {
	const [fallback, cleanFilePath] = normalizePath(filePath).split("/Captain_Data/");
	return cleanFilePath ? PATH_PLACEHOLDER + cleanFilePath : fallback;
}

export function extendCaptainData(content: string) {
	return normalizePath(content).replaceAll(
		new RegExp(PATH_PLACEHOLDER, "ig"),
		getCaptainData() + "/"
	);
}

export function createVectorSearchPrompt() {
	return `You return a single search query using several tags or words that help in a vector search (e.g. "illustrations of cute animals, like kittens or puppies playful and cute"). You receive a history of user assistant messages and find the perfect search query for it. You never interact or continue this discussion. Your task is to return a query to help find results. **The user never sees your answer**. Your answer will only be used to run the query through a search. Remember. Your answer is a perfect search query, 1 - 2 sentences maximum. No additional comments or explanation, no user interaction.`;
}

export function createSystemPrompt() {
	return `# You are Captain | The AI Platform

## You are:
- an open source app developed by Blibla, a german startup from Mainz.
- always nice to the user
- a great support for any problem
- always encouraging
- the user's best friend

## You can:
- store data locally and keep personal data private.
- retrieve data based on user queries by utilizing the integrated local vector store (powered by Qdrant and local embeddings)
- access files from the user's computer, but only those files that are registered in Captain (e.g. every file generated in captain is automatically available)
- link to certain files and/or display them inline if asked to do so. (links or images will open in the integrated Explorer if clicked).
- speak 11 languages (German, English, Spanish, French,Italian, Japanese, Dutch, Polish, Portuguese, Russian, Chinese) and answer in that language if the user uses it

> [!NOTE]
> At any time you act as Captain.
> Each user query includes context retrieved by a vector search. The score(0 - 1) determines how well it matches the user's query.

## You follow this Guide:

Feature: User Interaction
	As a User
	I want to get personalized help from Captain
	So that I am assisted when using the Captain AI Platform

Scenario: user speaks x-language
	When the user asks in {language}
	Then you respond in {language}
	And your tone is simple, using common language that is clear
	And your response is easy to understand
	And you use simple vocabulary to include non-native speakers of given language
Scenario: context is empty
	When the context is empty
	Then there might not be any related data.
Scenario: context has entries
	When the context contains entries
	Then they might be related to the user's query
Scenario: context has images
	When the context includes images
	Then you answer with image tags so that they can be rendered e.g. ![alt value](${PATH_PLACEHOLDER}/path/to/image.ext)
Scenario: user wants a story
	When asked to write a story
	And the context contains images
	Then you select 1 - 3 images, the ones, that best fit the storyline.
	And you inline the images within the story
	And you return the story including the images.
Scenario: user wants lists and/or links
	When asked for links or lists
	Then you include the reference to found entries as links e.g. [Link label](${PATH_PLACEHOLDER}/path/to/file.ext)
Scenario: user has a question related to Captain
	When the user asks about Captain
	Then you explain what you are and how you work
	And you offer things to try out
Scenario: misc user input
	When the user asks a question
	Then you try to make sense of it within the context
	And you use what is useful to answer the questions ar perform the given tasks
	And you respond accordingly.
	And you always make sure to add references as applicable
Scenario: user wants responses based on your last message
	When the user asks to write a story about one of the images from your last response
	Then you ignore the context
	And you use the previous messages as context
`;
}

export async function chatCompletion({
	model,
	system,
	messages,
	onStep,
}: {
	model: LanguageModelV1;
	system: string | undefined;
	messages: CoreMessage[];
	onStep?(_partialResponse: string): void;
}) {
	const result = await streamText({
		model,
		system,
		messages,
	});

	let fullResponse = "";
	for await (const delta of result.textStream) {
		fullResponse += delta;
		if (onStep) {
			onStep(fullResponse);
		}
	}

	return fullResponse;
}

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
				dataTypes?: DataTypeItem[];
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
							messages: chat.messages.map(message => ({
								...message,
								id: v4(),
								content: extendCaptainData(message.content as string),
							})),
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
					const dataTypes = message.payload.dataTypes ?? availableDataTypes;
					const includedDataTypes = dataTypes
						.filter(dataType => dataType.active)
						.map(dataType => dataType.type);

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

					const lastMessage = { role: "user" as const, content: userInput };
					let optimizedContext = "\n<!-- NO CONTEXT -->\n";
					if (includedDataTypes.length > 0) {
						logger.info(`Assistant uses data: ${includedDataTypes.join(", ")}`);

						const minorContent = [
							...chat.messages.slice(-3),
							{
								role: "user" as const,
								content: userInput + " => ONLY ANSWER WITH A SEARCH QUERY!!!",
							},
						].filter(Boolean);

						const query = await chatCompletion({
							model: assistant(model),
							system: createVectorSearchPrompt(),
							messages: minorContent,
						});

						logger.info("Sending Query for RAG:", query);

						const vectorStore = VectorStore.getInstance;

						// Prepare array of dataTypes used in the lookup
						const must: QdrantSchemas["Filter"]["must"] = [
							{ key: "type", match: { any: includedDataTypes } },
						];

						const response = await vectorStore.search(VECTOR_STORE_COLLECTION, query, {
							limit: 10,
							score_threshold: 0.3,
							filter: {
								must,
							},
						});

						const context = await Promise.all(
							response.map(async entry => {
								const entryPayload = (entry as unknown as VectorStoreDocument)
									.payload!;
								const { filePath } = entryPayload;
								//
								const cleanFilePath = filePath && cropCaptainData(filePath);

								if (entry.payload!.fileType === "png") {
									return {
										id: entryPayload.id,
										type: entryPayload.type,
										score: entry.score,
										filePath: cleanFilePath,
										content: entryPayload.content,
										label: entryPayload.label,
									};
								}

								if (entry.payload!.fileType === "md") {
									return {
										id: entryPayload.id,
										type: entryPayload.type,
										score: entry.score,
										filePath: cleanFilePath,
										content: entryPayload.content,
										label: entryPayload.label,
									};
								}

								return {
									id: entryPayload.id,
									type: entryPayload.type,
									score: entry.score,
									filePath: cleanFilePath,
									content: entryPayload.content,
									label: entryPayload.label,
								};
							})
						);
						const files: Record<string, RAGDocument> = {};
						for (const entry of context.filter(Boolean)) {
							if (files[entry.id]) {
								files[entry.id].content += `...\n...${entry.content}`;
							} else {
								files[entry.id] = entry;
							}
						}

						const fileArray = Object.values(files);
						optimizedContext = optimizeContext(fileArray);
					} else {
						logger.info("Assistant NOT sing data");
					}

					// Only send the last N messages
					const limit = message.payload.maxHistory ?? 10;
					const limitedHistory = chat.messages.slice(-limit);
					const messageWithContext = {
						role: "user" as const,
						content: `${optimizedContext}\n${lastMessage.content}`,
					};
					limitedHistory.push(messageWithContext);

					const result = await streamText({
						model: assistant(model),
						system: createSystemPrompt(),
						messages: limitedHistory,
					});

					let fullResponse = "";
					for await (const delta of result.textStream) {
						fullResponse += delta;
						event.sender.send(channel, {
							action: "assistant:response",
							payload: {
								output: extendCaptainData(fullResponse),
								done: false,
							},
						});
					}

					chat.model = model;
					chat.dataTypes = dataTypes;
					chat.messages.push(lastMessage, {
						role: "assistant",
						content: fullResponse,
						model,
					});
					assistantStore.set(chatId, chat);
					event.sender.send(channel, {
						action: "assistant:response",
						payload: {
							output: extendCaptainData(fullResponse),
							done: true,
							model,
						},
					});
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

			default: {
				break;
			}
		}
	}
);
