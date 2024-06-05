import { useSDK } from "@captn/react/use-sdk";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import SendIcon from "@mui/icons-material/Send";
import Box from "@mui/joy/Box";
import IconButton from "@mui/joy/IconButton";
import List from "@mui/joy/List";
import Sheet from "@mui/joy/Sheet";
import type { ColorPaletteProp } from "@mui/joy/styles";
import Textarea from "@mui/joy/Textarea";
import { useTranslation } from "next-i18next";
import type { LegacyRef } from "react";
import { useEffect } from "react";
import { useRef, useState } from "react";
import type { List as VirtualList } from "react-virtualized";
import { v4 } from "uuid";

import { APP_ID } from "./constants";

import { ChatList } from "@/client/apps/assistant/components/chat-list";
import { ChatName } from "@/client/apps/assistant/components/chat-name";
import { DataTypeSelector } from "@/client/apps/assistant/components/data-type-selector";
import { MessageStack } from "@/client/apps/assistant/components/message-stack";
import { Messages } from "@/client/apps/assistant/components/messages";
import { ModelSelector } from "@/client/apps/assistant/components/model-selector";
import { StickyChatList } from "@/client/apps/assistant/components/sticky-chat-list";
import { useAssistant } from "@/client/apps/assistant/hooks/assistant";

export function Assistant({ color }: { color: ColorPaletteProp }) {
	const { t } = useTranslation(["labels", "common"]);
	const [showScrollToBottom, setShowScrollToBottom] = useState(false);
	const listReference = useRef<VirtualList>();

	const {
		error,
		model,
		setModel,
		dataTypes,
		setDataTypes,
		provider,
		isWarningOpen,
		setError,
		setChatName,
		setChatId,
		chatName,
		chatId,
		chats,
		modelPrefix,
		input,
		setInput,
		setIsGenerating,
		isGenerating,
		messages,
		message,
		setMessages,
	} = useAssistant();
	const [scrollToIndex, setScrollToIndex] = useState(messages.length + (message ? 1 : 0) - 1);
	const { send } = useSDK<unknown, object>(APP_ID, {});

	useEffect(() => {
		setScrollToIndex(messages.length + (message ? 1 : 0) - 1);
	}, [messages, message]);

	function sendMessage() {
		setIsGenerating(true);
		setInput("");
		setMessages(previousState => [
			...previousState,
			{ role: "user", content: input.trim(), id: v4() },
		]);
		send({
			action: "assistant:chat",
			payload: {
				input: input.trim(),
				id: chatId,
				model,
				maxHistory: 10,
				dataTypes,
			},
		});
	}

	return (
		<Box sx={{ flex: 1, display: "flex", height: "100%" }}>
			<MessageStack
				error={error}
				provider={provider}
				isWarningOpen={isWarningOpen}
				onClose={() => {
					setError("");
				}}
			/>
			<Sheet
				color="neutral"
				variant="soft"
				sx={{
					display: "flex",
					flexDirection: "column",
					overflow: "hidden",
					width: 200,
					flexShrink: 0,
				}}
			>
				<List sx={{ flexGrow: 0 }}>
					<StickyChatList
						color={color}
						onNew={() => {
							setChatName("New Chat");
							setChatId(v4());
						}}
					/>
					<ChatList
						chatId={chatId}
						chats={chats}
						color={color}
						onChatSelect={chatId_ => {
							setChatId(chatId_);
						}}
						onDelete={chatId_ => {
							send({
								action: "assistant:delete",
								payload: { id: chatId_ },
							});
							if (chatId_ === chatId) {
								setChatName("New Chat");
								setChatId(v4());
							}
						}}
					/>
				</List>
			</Sheet>
			<Box
				sx={{
					flex: 1,
					display: "flex",
					flexDirection: "column",
					width: "calc(100% - 200px)",
				}}
			>
				<Sheet color="neutral" variant="soft" sx={{ py: 0.75, px: 1 }}>
					<Box sx={{ display: "flex", gap: 1, width: "100%" }}>
						<ModelSelector
							model={model}
							modelPrefix={modelPrefix}
							onModelSelect={model_ => {
								setModel(model_);
							}}
						/>
						<ChatName
							name={chatName}
							color="neutral"
							onUpdate={label => {
								setChatName(label);
								send({
									action: "assistant:update",
									payload: {
										id: chatId,
										update: { label },
									},
								});
							}}
						/>
						<DataTypeSelector
							dataTypes={dataTypes}
							onChange={(dataTypeId, isChecked) => {
								setDataTypes(previousState =>
									previousState.map(dataType_ =>
										dataType_.id === dataTypeId
											? {
													...dataType_,
													active: isChecked,
												}
											: dataType_
									)
								);
							}}
						/>
					</Box>
				</Sheet>
				<Box
					sx={{
						flex: 1,
						overflow: "hidden",
						display: "flex",
					}}
				>
					<Messages
						ref={listReference as LegacyRef<VirtualList>}
						messages={messages}
						message={message}
						model={model}
						modelPrefix={modelPrefix}
						color={color}
						scrollToIndex={scrollToIndex}
						onScroll={({ clientHeight, scrollHeight, scrollTop }) => {
							const threshold = 200;
							const isNearBottom =
								scrollHeight - scrollTop - clientHeight < threshold;
							setShowScrollToBottom(!isNearBottom);
							setScrollToIndex(
								isNearBottom ? messages.length + (message ? 1 : 0) - 1 : -1
							);
						}}
					/>
				</Box>
				<Box sx={{ p: 1, position: "relative" }}>
					<Box
						sx={{
							position: "absolute",
							bottom: "100%",
							left: "50%",
							mb: 1,
							transform: "translateX(-50%)",
							display: showScrollToBottom ? "flex" : "none",
						}}
					>
						<IconButton
							color={color}
							variant="soft"
							aria-label={t("labels:toEnd")}
							onClick={() => {
								setScrollToIndex(messages.length + (message ? 1 : 0) - 1);
							}}
						>
							<ArrowDownwardIcon />
						</IconButton>
					</Box>
					<Textarea
						value={input}
						minRows={1}
						maxRows={8}
						sx={{
							flexDirection: "row",
							"& .MuiTextarea-endDecorator": {
								alignItems: "flex-start",
								marginBlockStart: "unset",
							},
						}}
						endDecorator={
							<IconButton
								disabled={isGenerating}
								aria-label={t("common:send")}
								variant="solid"
								color={color}
								onClick={() => {
									sendMessage();
								}}
							>
								<SendIcon />
							</IconButton>
						}
						onChange={event => {
							setInput(event.target.value);
						}}
						onKeyDown={event => {
							if (event.key === "Enter" && !event.shiftKey && !isGenerating) {
								event.preventDefault();
								sendMessage();
							}
						}}
					/>
				</Box>
			</Box>
		</Box>
	);
}
