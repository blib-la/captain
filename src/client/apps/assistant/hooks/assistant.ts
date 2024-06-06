import { useSDK } from "@captn/react/use-sdk";
import { useEffect, useState } from "react";
import type { Except } from "type-fest";
import { v4 } from "uuid";

import { APP_ID, models } from "@/client/apps/assistant/constants";
import type { MessageModel } from "@/client/apps/assistant/types";
import { getModelInfo } from "@/client/apps/assistant/utils";
import type { ChatModel } from "@/shared/types/assistant";

export function useAssistant() {
	const [messages, setMessages] = useState<MessageModel[]>([]);
	const [message, setMessage] = useState("");
	const [chatName, setChatName] = useState("");
	const [isGenerating, setIsGenerating] = useState(false);
	const [input, setInput] = useState("");
	const [activeTool, setActiveTool] = useState<null | "textToImage" | "vectorSearch">(null);
	const [chatId, setChatId] = useState("");
	const [model, setModel] = useState(models[0].id);
	const [error, setError] = useState("");
	const [chats, setChats] = useState<(Except<ChatModel, "messages"> & { id: string })[]>([]);
	const [isWarningOpen, setIsWarningOpen] = useState(false);

	const [modelPrefix] = model.split("-");

	const { apiKeyGetter, provider } = getModelInfo(modelPrefix);

	const { send } = useSDK<unknown, object>(APP_ID, {
		onMessage(message) {
			setError("");
			switch (message.action) {
				case "assistant:nameSuggestion": {
					const { chatName: chatName_ } = message.payload as {
						chatName: string;
					};
					if (chatName_) {
						setChatName(chatName_);
					}

					break;
				}

				case "assistant:response": {
					const {
						output,
						done,
						model: model_,
						label: chatLabel,
					} = message.payload as {
						output: string;
						done: boolean;
						model: string;
						label?: string;
					};
					if (done) {
						setMessage("");
						setMessages(previousState => [
							...previousState,
							{
								role: "assistant",
								content: output,
								id: v4(),
								model: model_,
							},
						]);
						setIsGenerating(false);
						if (chatLabel) {
							setChatName(chatLabel);
						}
					} else {
						setIsGenerating(true);
						setMessage(output);
					}

					setActiveTool(null);

					break;
				}

				case "assistant:messages": {
					const { chat } = message.payload as {
						chat: Except<ChatModel, "messages"> & { messages: MessageModel[] };
					};
					setMessages(chat.messages);
					setModel(chat.model);
					setChatName(chat.label);

					break;
				}

				case "assistant:error": {
					const { error: error_ } = message.payload as {
						error: string;
					};
					setError(error_);
					setActiveTool(null);

					break;
				}

				case "assistant:tool": {
					const { tool, status } = message.payload as {
						tool: "textToImage" | "vectorSearch";
						status: "loading" | "done";
					};
					if (status === "loading") {
						setActiveTool(tool);
						setMessage(`${tool}: ${status}`);
					}

					break;
				}

				case "assistant:chats": {
					const { chats: allChats } = message.payload as {
						chats: (Except<ChatModel, "messages"> & { id: string })[];
					};
					setChats(allChats);

					break;
				}

				default: {
					break;
				}
			}
		},
	});

	useEffect(() => {
		if (chatId) {
			send({ action: "assistant:history", payload: { id: chatId } });
		} else {
			setChatName("New Chat");
			setChatId(v4());
		}
	}, [send, chatId]);

	useEffect(() => {
		if (!apiKeyGetter) {
			return;
		}

		window.ipc.send(apiKeyGetter);
		const unsubscribe = window.ipc.on(apiKeyGetter, (hasKey: boolean) => {
			setIsWarningOpen(!hasKey);
		});
		return () => {
			unsubscribe();
		};
	}, [apiKeyGetter]);

	return {
		error,
		provider,
		isWarningOpen,
		setError,
		setChatName,
		setChatId,
		activeTool,
		chatId,
		chats,
		model,
		setModel,

		modelPrefix,
		chatName,
		isGenerating,
		setIsGenerating,
		input,
		setInput,
		messages,
		message,
		setMessages,
	};
}
