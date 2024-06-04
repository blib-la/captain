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
import type { ComfyUIUpdate, VectorStoreDocument } from "@captn/utils/types";
import type { Schemas as QdrantSchemas } from "@qdrant/js-client-rest";
import type { CoreMessage, CoreTool, ToolCallPart, ToolResultPart } from "ai";
import { tool } from "ai";
import { streamText } from "ai";
import { ipcMain, type IpcMainEvent } from "electron";
import Store from "electron-store";
import type { Except } from "type-fest";
import { v4 } from "uuid";
import { z } from "zod";

import { copyWithMetaData } from "@/electron/png";
import { ComfyUI } from "@/electron/services/comfyui";
import { logError, logger } from "@/electron/services/logger";
import { VectorStore } from "@/electron/services/vector-store";
import { keyStore } from "@/electron/stores";
import { normalizePath } from "@/electron/utils/normalize-path";
import { getCaptainData, getComfyUIPath } from "@/electron/utils/path-helpers";
import { availableDataTypes } from "@/shared/assistant";
import { buildKey } from "@/shared/build-key";
import { VECTOR_STORE_COLLECTION } from "@/shared/constants";
import { KEY } from "@/shared/enums";
import { randomSeed } from "@/shared/number";
import type { ChatModel, DataTypeItem } from "@/shared/types/assistant";
import type { NodeChain } from "@/shared/types/comfyui";

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

export function optimizeContext(context: RAGDocument[]) {
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

export function createVectorSearchPrompt({ dataTypes }: { dataTypes: string[] }) {
	return `Based on the history of user-assistant messages, generate a single, highly relevant search query that includes several tags or keywords for a vector search. The query should be 1-2 sentences long and tailored to find specific results within the following data types: ${JSON.stringify(dataTypes)}. Do not interact with the user or provide any additional comments. The user will not see your query; it is only used for the search process.`;
}

export function createChatLabelPrompt() {
	return `Your task is to generate a short and concise label or title for the chat based on the user's initial question. The label should accurately reflect the main topic or intent of the user's inquiry, be in the same language as the user's question, and must be no more than four words. Ensure the label is clear and specific, capturing the essence of the conversation that is about to start. Yur answer is just the label, no comments or explanation, the user will not see your message or be able to interact with you.`;
}

export function createSystemPrompt() {
	return `# You are Captain | The AI Platform

## You are:
- An open source app developed by Blibla, a German startup from Mainz.
- Always nice to the user, encouraging, and a bit quirky but honest.
- The user's best friend and a great support for any problem.
- Extremely precise when precision is required.

## You can:
- Store data locally and keep personal data private.
- Retrieve data based on user queries using the integrated local vector store (powered by Qdrant and local embeddings).
- Access files from the user's computer, but only those files registered in Captain.
- Generate images with ComfyUI.
- Link to or display certain files inline if asked to do so.
- Speak 11 languages (German, English, Spanish, French, Italian, Japanese, Dutch, Polish, Portuguese, Russian, Chinese) and respond in the user's language.

> [!NOTE]
> You always act as Captain. Each user query includes context retrieved by a vector search. To activate the context, the user must select the datatypes in the menu. Only files in the selected category are included.

## Interaction Guide:

### User Interaction
- **Scenario: User speaks {language}**
  - Respond in {language} using simple, clear language.

- **Scenario: Context is empty**
  - Indicate there may not be related data.

- **Scenario: Context has entries**
  - Indicate they might be related to the user's query.

- **Scenario: Context includes images**
  - Answer with image tags (e.g., ![Image content](${PATH_PLACEHOLDER}/path/to/image.ext)).

- **Scenario: User requests a story**
  - Select 1-3 fitting images from the context.
  - Generate Images as required
  - Return the story including the image as inline image tags.

- **Scenario: User requests links or lists**
  - Include references to found entries as links (e.g., [Link label](${PATH_PLACEHOLDER}/path/to/file.ext)).

- **Scenario: User has a question about Captain**
  - Explain Captain's features and offer things to try out.

- **Scenario: Miscellaneous user input**
  - Use context to answer questions or perform tasks, and always add references if applicable.

- **Scenario: User wants responses based on the last message**
  - Ignore the context and use previous messages as context.

### Error Handling
- **Scenario: An error occurs**
  - Apologize and provide guidance on how to proceed or troubleshoot.
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

export function createWorkflow({
	prompt = "",
	negativePrompt = "",
	seed = 1234,
	steps = 20,
	height,
	width,
	cfg = 7,
	loraWeight = 1,
	checkpointName = "stabilityai\\stable-diffusion-xl-base-1.0\\sd_xl_base_1.0_0.9vae.safetensors",
	loraName,
}: {
	prompt?: string;
	negativePrompt?: string;
	seed?: number;
	height: number;
	width: number;
	steps?: number;
	cfg?: number;
	checkpointName?: string;
	loraName?: string;
	loraWeight?: number;
}) {
	const hasLora = loraName && loraWeight > 0;
	const finalModel = hasLora ? "lora" : "model";
	const workflow: NodeChain = {
		kSampler: {
			inputs: {
				seed,
				steps,
				cfg,
				sampler_name: "dpmpp_2m_sde_gpu",
				scheduler: "karras",
				denoise: 1,
				model: [finalModel, 0],
				positive: ["prompt", 0],
				negative: ["negativePrompt", 0],
				latent_image: ["latentImage", 0],
			},
			class_type: "KSampler",
		},
		model: {
			inputs: {
				ckpt_name: checkpointName,
			},
			class_type: "CheckpointLoaderSimple",
		},
		latentImage: {
			inputs: {
				width,
				height,
				batch_size: 1,
			},
			class_type: "EmptyLatentImage",
		},
		prompt: {
			inputs: {
				text: prompt,
				clip: [finalModel, 1],
			},
			class_type: "CLIPTextEncode",
		},
		negativePrompt: {
			inputs: {
				text: negativePrompt,
				clip: [finalModel, 1],
			},
			class_type: "CLIPTextEncode",
		},
		vaeDecode: {
			inputs: {
				samples: ["kSampler", 0],
				vae: ["model", 2],
			},
			class_type: "VAEDecode",
		},
		output: {
			inputs: {
				filename_prefix: "images/captain",
				images: ["vaeDecode", 0],
			},
			class_type: "PreviewImage",
		},
	};
	if (hasLora) {
		workflow.lora = {
			inputs: {
				lora_name: loraName,
				strength_model: loraWeight,
				strength_clip: loraWeight,
				model: ["model", 0],
				clip: ["model", 1],
			},
			class_type: "LoraLoader",
		};
	}

	return workflow;
}

function tools(appId: string, send?: <T>(action: string, payload: T) => void) {
	return {
		textToImage: tool({
			description: "Generate an image for the user (using ComfyUI).",
			parameters: z
				.object({
					prompt: z
						.string()
						.describe("The enhanced/optimized prompt for the image to be generated."),
					seed: z
						.number()
						.gt(0)
						.lt(2 ** 32)
						.default(randomSeed())
						.describe(
							`An optional seed to be used for the generation (1 - ${2 ** 32}). You can reuse old seeds too.`
						),
					dimensions: z
						.object({
							height: z
								.number()
								.positive()
								.gte(640)
								.lte(1536)
								.int()
								.describe("The height of the generated image int(640-1536)."),
							width: z
								.number()
								.positive()
								.gte(640)
								.lte(1536)
								.int()
								.describe("The width of the generated image int(640-1536)."),
						})
						.required({ height: true, width: true })
						.default({ height: 1024, width: 1024 })
						.describe(
							"The dimensions: height and width of the generated image (max area of ~1024*1024)."
						),
				})
				.required({ prompt: true }),

			async execute({ prompt, seed, dimensions: { height, width } }) {
				const comfyClient = v4();
				if (send) {
					send("assistant:tool", { tool: "textToImage", status: "loading" });
				}

				logger.info("Generating Image:", {
					height,
					width,
					seed,
					prompt,
				});

				const filePath = await new Promise<string>((resolve, reject) => {
					try {
						ComfyUI.getInstance.registerClient(
							comfyClient,
							async (data: ComfyUIUpdate) => {
								switch (data.type) {
									case "executed": {
										const [image] = data.data.output.images;
										const filePath = getComfyUIPath(
											"temp",
											image.subfolder,
											image.filename
										);
										const destinationPath = await copyWithMetaData({
											source: filePath,
											destination: `images/${v4()}.png`,
											metadata: { positivePrompt: prompt },
										});
										if (destinationPath) {
											resolve(destinationPath);
										} else {
											reject(new Error("Could not generate the image"));
										}

										break;
									}

									default: {
										break;
									}
								}
							}
						);
						ComfyUI.getInstance
							.queueWorkflow(
								createWorkflow({
									prompt: [
										prompt,
										"highres",
										"4k resolution",
										"best quality",
									].join(", "),
									negativePrompt: [
										"worst quality",
										"lowres",
										"blurry",
										"smudge",
										"nsfw",
										"nude",
									].join(", "),
									seed,
									height,
									width,
								}),
								comfyClient
							)
							.catch(error => {
								reject(error);
							});
					} catch (error) {
						reject(error);
					}
				});
				ComfyUI.getInstance.unregisterClient(comfyClient);

				return {
					prompt,
					filePath: cropCaptainData(filePath),
				};
			},
		}),
	};
}

export function getAssistant(model: string) {
	const [modelPrefix] = model.split("-");
	switch (modelPrefix) {
		case "gpt": {
			return createOpenAI({ apiKey: keyStore.get("openAiApiKey") });
		}

		case "claude": {
			return createAnthropic({
				apiKey: keyStore.get("anthropicApiKey"),
			});
		}

		case "mistral": {
			return createMistral({
				apiKey: keyStore.get("mistralApiKey"),
			});
		}

		case "models/gemini": {
			return createGoogleGenerativeAI({
				apiKey: keyStore.get("googleGenerativeAiApiKey"),
			});
		}

		default:
	}
}

export async function getContext(
	assistant: OpenAIProvider | AnthropicProvider | MistralProvider | GoogleGenerativeAIProvider,
	chat: ChatModel,
	{
		includedDataTypes,
		userInput,
		model,
	}: { includedDataTypes: string[]; userInput: string; model: string }
) {
	let optimizedContext = "\n<!-- NO CONTEXT -->\n";
	if (includedDataTypes.length > 0) {
		logger.info(`Assistant uses data: ${includedDataTypes.join(", ")}`);

		const minorContent = [
			...chat.messages.slice(-2),
			{
				role: "user" as const,
				content: userInput + " => ONLY ANSWER WITH A SEARCH QUERY!!!",
			},
		].filter(Boolean);
		if (minorContent[0] && minorContent[0].role !== "user") {
			minorContent.shift();
		}

		const query = await chatCompletion({
			model: assistant(model),
			system: createVectorSearchPrompt({ dataTypes: includedDataTypes }),
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
				const entryPayload = (entry as unknown as VectorStoreDocument).payload!;
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

	return optimizedContext;
}

export async function streamWithTools<TOOLS extends Record<string, CoreTool>>(
	assistant: OpenAIProvider | AnthropicProvider | MistralProvider | GoogleGenerativeAIProvider,
	{
		history,
		onStream,
		tools,
		model,
	}: {
		history: CoreMessage[];
		onStream(response: string): void;
		tools: TOOLS;
		model: string;
	}
) {
	let fullResponse = "";

	try {
		let result = await streamText<TOOLS>({
			model: assistant(model),
			system: createSystemPrompt(),
			messages: history,
			tools,
		});

		const toolCalls: ToolCallPart[] = [];
		const toolResults: ToolResultPart[] = [];
		for await (const delta of result.fullStream) {
			switch (delta.type) {
				case "tool-call": {
					logger.info("toolCall", delta);
					toolCalls.push(delta);

					break;
				}

				case "tool-result": {
					logger.info("toolResult", delta);
					toolResults.push(delta);

					break;
				}

				case "text-delta": {
					fullResponse += delta.textDelta;
					onStream(fullResponse);
					break;
				}

				default: {
					break;
				}
			}
		}

		logger.info("toolCalls", toolCalls);
		logger.info("toolResults", toolResults);

		if (toolResults.length > 0) {
			history.push(
				{
					role: "assistant",
					content: toolCalls,
				},
				{
					role: "tool",
					content: toolResults,
				}
			);
			result = await streamText<TOOLS>({
				model: assistant(model),
				system: createSystemPrompt(),
				messages: history,
				tools,
			});
			for await (const delta of result.textStream) {
				fullResponse += delta;
				onStream(fullResponse);
			}
		}
	} catch (error) {
		logError(error);
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
					const userInput = message.payload.input!;
					const model = message.payload.model ?? "gpt-3.5-turbo";
					const dataTypes = message.payload.dataTypes ?? availableDataTypes;
					const includedDataTypes = dataTypes
						.filter(dataType => dataType.active)
						.map(dataType => dataType.type);
					const assistant = getAssistant(model);

					if (!assistant) {
						event.sender.send(channel, {
							action: "assistant:error",
							payload: { error: `Failed creating assistant for model: "${model}"` },
						});
						return;
					}

					const lastMessage = { role: "user" as const, content: userInput };
					if (chat.messages.length === 0) {
						// LastMessage is first message. Let AI create a label / title
						chat.label = await chatCompletion({
							model: assistant(model),
							system: createChatLabelPrompt(),
							messages: [lastMessage],
						});
						event.sender.send(channel, {
							action: "assistant:nameSuggestion",
							payload: {
								chatName: chat.label,
							},
						});
					}

					const optimizedContext = getContext(assistant, chat, {
						includedDataTypes,
						model,
						userInput,
					});

					// Only send the last N messages
					const limit = message.payload.maxHistory ?? 10;
					const limitedHistory = chat.messages.slice(-limit);

					limitedHistory.push({
						role: "user",
						content: `${optimizedContext}\n${lastMessage.content}`,
					});

					const fullResponse = await streamWithTools(assistant, {
						history: limitedHistory,
						model,
						tools: tools(appId, (action, payload) => {
							event.sender.send(channel, { action, payload });
						}),
						onStream(fullResponse: string) {
							event.sender.send(channel, {
								action: "assistant:response",
								payload: {
									output: extendCaptainData(fullResponse),
									done: false,
								},
							});
						},
					});

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
							label: chat.label,
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
