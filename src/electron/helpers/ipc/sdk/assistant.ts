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
import type { ComfyUIUpdate } from "@captn/utils/types";
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
import { inventoryStore, keyStore } from "@/electron/stores";
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

export function replaceCaptainData(content: string) {
	return normalizePath(content).replaceAll(
		new RegExp(getCaptainData() + "/", "ig"),
		PATH_PLACEHOLDER
	);
}

export function createVectorSearchPrompt({ dataTypes }: { dataTypes: string[] }) {
	return `Based on the history of user-assistant messages, generate a single, highly relevant search query that includes several tags or keywords for a vector search. The query should be 1-2 sentences long and tailored to find specific results within the following data types: ${JSON.stringify(dataTypes)}. Do not interact with the user or provide any additional comments. The user will not see your query; it is only used for the search process.`;
}

export function createChatLabelPrompt() {
	return `Your task is to generate a short and concise label or title for the chat based on the user's initial question. The label should accurately reflect the main topic or intent of the user's inquiry, be in the same language as the user's question, and must be no more than four words. Ensure the label is clear and specific, capturing the essence of the conversation that is about to start. Yur answer is just the label, no comments or explanation, the user will not see your message or be able to interact with you.`;
}

export function createSystemPrompt({ model, provider }: { model: string; provider: string }) {
	return `# System Guide for "Captain | The AI platform"

## You are:
- Captain
- An app that uses different AI models.
- Always nice to the user, encouraging, and a bit quirky but honest.
- The user's best friend and a great support for any problem.
- Extremely precise when precision is required.
- Currently using the model: ${model} by ${provider}.

## You can:
- Store data locally and keep personal data private.
- Retrieve data based on user queries using the local vector store.
- Access files from the user's computer, but only those files registered in Captain.
- Generate images with ComfyUI.
- Link to or display certain files inline if asked to do so.


## User Interaction Guide:

\`\`\`gherkin
Scenario: User speaks {language}
  When user speaks {language}
  Then you answer in {language}
  And your response is simple and clear

Scenario: User wants to know about Captain
  When user asks about Captain and it's usage
  Then you briefly introduce yourself
  And you tell them what they want to know

Scenario: A vector search is required
  When a vector search is required
  Then you select the correct category
  And you prepare a perfect query
  And your query uses several trigger words in natural language format

Scenario: Your response includes images
  When your response includes images
  Then you answer with image tags (e.g., ![{Image prompt or caption}](${PATH_PLACEHOLDER}/path/to/image.ext))

Scenario: Your response includes links
  When your response includes images
  Then you include references to entries as links (e.g., [{Link label}](${PATH_PLACEHOLDER}/path/to/file.ext))

Scenario: User wants an image generated
  When user asks you to generate an image
  Then you create an optimized and contextualized prompt
  And you generate the image with ComfyUI

Scenario: User wants to search existing images
  When user asks you to look for an image
  Then you perform a vector search for "image"
  And your response includes images

Scenario: User requests links or lists
  When the user asks you to list links
  Then you perform a vector search for {category}
  And your response includes links

Scenario: User requests info on apps
  When the user asks you about the included apps
  Then you perform a vector search for "app"
  And your response includes links

Scenario: User wants a story
  When the user wants a story
  Then you generate images
  And you write a story about the images
  And each image has a paragraph
  And your response includes text with inline images

Scenario: Miscellaneous user input
  When the user submits a miscellaneous input
  Then you act accordingly
  And you aim to fulfill their request

Scenario: An error occurs
  When an error occurs
  Then you inform the user kindly
\`\`\`
`;
}

export function createSystemPrompt2({ model, provider }: { model: string; provider: string }) {
	return `# System Guide for "Captain | The AI platform"

## You are:
- Captain
- An app that uses different AI models.
- Always nice to the user, encouraging, and a bit quirky but honest.
- The user's best friend and a great support for any problem.
- Extremely precise when precision is required.
- Currently using the model: ${model} by ${provider}.

## You can:
- Store data locally and keep personal data private.
- Retrieve data based on user queries using the local vector store.
- Access files from the user's computer, but only those files registered in Captain.
- Generate images with ComfyUI.
- Link to or display certain files inline if asked to do so.

## User Interaction Guide:

\`\`\`gherkin
Scenario: User speaks {language}
  When user speaks {language}
  Then you answer in {language}
  And your response is simple and clear

Scenario: User wants to know about Captain
  When user asks about Captain and it's usage
  Then you briefly introduce yourself
  And you tell them what they want to know

Scenario: Your response includes images
  When your response includes images
  Then you answer with image tags (e.g., ![{Image prompt or caption}](${PATH_PLACEHOLDER}/path/to/image.ext))

Scenario: Your response includes links
  When your response includes images
  Then you include references to entries as links (e.g., [{Link label}](${PATH_PLACEHOLDER}/path/to/file.ext))

Scenario: User requests links or lists
  When the user asks you to list links
  Then your response includes links

Scenario: User requests info on apps
  When the user asks you about the included apps
  Then your response includes links

Scenario: User wants a story
  When the user wants a story
  Then you write a story about the images
  And each image has a paragraph
  And your response includes text with inline images

Scenario: Miscellaneous user input
  When the user submits a miscellaneous input
  Then you act accordingly
  And you aim to fulfill their request

Scenario: An error occurs
  When an error occurs
  Then you inform the user kindly
\`\`\`
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

export const STORE_CATEGORIES = ["image", "story", "app"] as const;

export function cropIncompleteImageTag(markdown: string): string {
	const imgTagOpen = "![";
	const imgTagClose = "](";
	const imgTagEnd = ")";

	// Find the last occurrence of an open image tag
	const lastOpenTagIndex = markdown.lastIndexOf(imgTagOpen);
	if (lastOpenTagIndex === -1) {
		return markdown;
	} // No image tag found, return as is

	// Find the corresponding closing brackets
	const lastCloseTagIndex = markdown.indexOf(imgTagClose, lastOpenTagIndex);
	if (lastCloseTagIndex === -1) {
		// Incomplete image tag, crop the tail
		return markdown.slice(0, Math.max(0, lastOpenTagIndex));
	}

	// Find the end of the image tag
	const lastEndTagIndex = markdown.indexOf(imgTagEnd, lastCloseTagIndex);
	if (lastEndTagIndex === -1) {
		// Incomplete image tag, crop the tail
		return markdown.slice(0, Math.max(0, lastOpenTagIndex));
	}

	// If the image tag is complete, return as is
	return markdown;
}

export function tools(appId: string, send?: <T>(action: string, payload: T) => void) {
	return {
		vectorSearch: tool({
			description: "Search the user's files for matches in the vector store",
			parameters: z
				.object({
					query: z.string().describe("The search query"),
					categories: z
						.array(z.enum(STORE_CATEGORIES))
						.describe(
							`Categories to search, one or more of: ${STORE_CATEGORIES.join(", ")}`
						),
				})
				.required({ query: true }),
			async execute({ query, categories }) {
				logger.info("Sending Query for RAG:", query);
				if (send) {
					send("assistant:tool", { tool: "vectorSearch", status: "loading" });
				}

				const vectorStore = VectorStore.getInstance;

				// Prepare array of dataTypes used in the lookup
				const must: QdrantSchemas["Filter"]["must"] = [
					{ key: "type", match: { any: categories } },
				];

				try {
					const response = await vectorStore.search(VECTOR_STORE_COLLECTION, query, {
						limit: 10,
						score_threshold: 0.3,
						filter: {
							must,
						},
					});

					return {
						matches: response.map(entry => ({
							...entry.payload,
							filePath:
								entry.payload?.filePath &&
								cropCaptainData(entry.payload!.filePath as string),
						})),
					};
				} catch (error) {
					logError(error);
					const message = `Could not perform the vector search for {query: ${query}, categories: ${JSON.stringify(categories)}`;
					if (send) {
						send("assistant:error", { error: message });
					}

					return {
						error: message,
					};
				}
			},
		}),
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
				const checkpoints = inventoryStore.get<string, { id: string }[]>(
					"stable-diffusion.checkpoints",
					[]
				);
				const hasSDXL = checkpoints.some(
					checkpoint => checkpoint.id === "stabilityai/stable-diffusion-xl-base-1.0"
				);
				if (!hasSDXL) {
					const error =
						"Stable Diffusion XL (SDXL) is not available. Please download it in the Marketplace.";
					if (send) {
						send("assistant:error", { error });
					}

					return {
						error,
					};
				}

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
					height,
					width,
					seed,
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

		default: {
			return null;
		}
	}
}

export function getProvider(model: string) {
	const [modelPrefix] = model.split("-");
	switch (modelPrefix) {
		case "gpt": {
			return "Open AI";
		}

		case "claude": {
			return "Anthropic";
		}

		case "mistral": {
			return "Mistral";
		}

		case "models/gemini": {
			return "Google";
		}

		default: {
			return "Unknown";
		}
	}
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
			system: createSystemPrompt({ model, provider: getProvider(model) }),
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
				system: createSystemPrompt2({ model, provider: getProvider(model) }),
				messages: history,
				tools: {} as TOOLS,
			});
			for await (const delta of result.textStream) {
				fullResponse += delta;
				onStream(cropIncompleteImageTag(fullResponse));
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
					const assistant = getAssistant(model);

					if (!assistant) {
						event.sender.send(channel, {
							action: "assistant:error",
							payload: { error: `Failed creating assistant for model: "${model}"` },
						});
						return;
					}

					if (chat.messages.length === 0) {
						// LastMessage is first message. Let AI create a label / title
						chat.label = await chatCompletion({
							model: assistant(model),
							system: createChatLabelPrompt(),
							messages: [
								{ role: "user", content: `Create a label for: ${userInput}` },
							],
						});
						event.sender.send(channel, {
							action: "assistant:nameSuggestion",
							payload: {
								chatName: chat.label,
							},
						});
					}

					// Only send the last N messages
					const limit = message.payload.maxHistory ?? 10;
					const limitedHistory = chat.messages.slice(-limit);
					const lastMessage = { role: "user" as const, content: userInput };

					limitedHistory.push(lastMessage);

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
