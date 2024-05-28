import { useSDK } from "@captn/react/use-sdk";
import { useEffect, useRef, useState } from "react";
import type { Except } from "type-fest";
import { v4 } from "uuid";

import { APP_ID, models } from "@/client/apps/assistant/constants";
import type { MessageModel } from "@/client/apps/assistant/types";
import { getModelInfo } from "@/client/apps/assistant/utils";
import { availableDataTypes } from "@/shared/assistant";
import type { ChatModel } from "@/shared/types/assistant";

export function useAssistant() {
	const [messages, setMessages] = useState<MessageModel[]>([]);
	const [message, setMesssage] = useState("");
	const [chatName, setChatName] = useState("");
	const [isGenerating, setIsGenerating] = useState(false);
	const [input, setInput] = useState("");
	const [chatId, setChatId] = useState("");
	const [model, setModel] = useState(models[0].id);
	const [error, setError] = useState("");
	const [chats, setChats] = useState<(Except<ChatModel, "messages"> & { id: string })[]>([]);
	const [isWarningOpen, setIsWarningOpen] = useState(false);
	const [dataTypes, setDataTypes] = useState(availableDataTypes);

	const firstRunReference = useRef(true);
	const scrollContainerReference = useRef<HTMLDivElement | null>(null);

	const [modelPrefix] = model.split("-");

	const { apiKeyGetter, provider } = getModelInfo(modelPrefix);

	const { send } = useSDK<unknown, object>(APP_ID, {
		onMessage(message) {
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
						setMesssage("");
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
						setMesssage(output);
					}

					break;
				}

				case "assistant:messages": {
					const { chat } = message.payload as {
						chat: Except<ChatModel, "messages"> & { messages: MessageModel[] };
					};
					firstRunReference.current = true;
					setMessages(chat.messages);
					setDataTypes(
						availableDataTypes.map(dataType => {
							const chatDataTypes = chat.dataTypes ?? [];
							const overwrite = chatDataTypes.find(
								dataType_ => dataType_.id === dataType.id
							);
							return overwrite ?? dataType;
						})
					);
					setModel(chat.model);
					setChatName(chat.label);

					break;
				}

				case "assistant:error": {
					const { error: error_ } = message.payload as {
						error: string;
					};
					setError(error_);

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
		const container = scrollContainerReference.current;
		if (container) {
			const threshold = 200;
			const isNearBottom =
				container.scrollHeight - container.scrollTop - container.clientHeight < threshold;

			if (isNearBottom || firstRunReference.current) {
				container.scrollTop = container.scrollHeight;
				firstRunReference.current = false;
			}
		}
	}, [messages, message]);

	useEffect(() => {
		const container = scrollContainerReference.current;
		if (container) {
			container.scrollTop = container.scrollHeight;
		}

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
		chatId,
		chats,
		model,
		setModel,
		dataTypes,
		setDataTypes,
		modelPrefix,
		scrollContainerReference,
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
