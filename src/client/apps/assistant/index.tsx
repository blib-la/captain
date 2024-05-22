import { useSDK } from "@captn/react/use-sdk";
import AddCommentIcon from "@mui/icons-material/AddComment";
import CloseIcon from "@mui/icons-material/Close";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import PersonIcon from "@mui/icons-material/Person";
import PushPinIcon from "@mui/icons-material/PushPin";
import SendIcon from "@mui/icons-material/Send";
import StarIcon from "@mui/icons-material/Star";
import Avatar from "@mui/joy/Avatar";
import Box from "@mui/joy/Box";
import Dropdown from "@mui/joy/Dropdown";
import IconButton from "@mui/joy/IconButton";
import Input from "@mui/joy/Input";
import List from "@mui/joy/List";
import ListItem from "@mui/joy/ListItem";
import ListItemButton from "@mui/joy/ListItemButton";
import ListItemContent from "@mui/joy/ListItemContent";
import ListItemDecorator from "@mui/joy/ListItemDecorator";
import Menu from "@mui/joy/Menu";
import MenuButton from "@mui/joy/MenuButton";
import MenuItem from "@mui/joy/MenuItem";
import Option from "@mui/joy/Option";
import Select from "@mui/joy/Select";
import Sheet from "@mui/joy/Sheet";
import Snackbar from "@mui/joy/Snackbar";
import type { ColorPaletteProp } from "@mui/joy/styles";
import Textarea from "@mui/joy/Textarea";
import Tooltip from "@mui/joy/Tooltip";
import Typography from "@mui/joy/Typography";
import { useTranslation } from "next-i18next";
import VirtualList from "rc-virtual-list";
import type { ListRef } from "rc-virtual-list/es/List";
import type { MutableRefObject } from "react";
import { useMemo } from "react";
import { useEffect, useRef, useState } from "react";
import AutoSizer from "react-virtualized-auto-sizer";
import type { Except } from "type-fest";
import { v4 } from "uuid";

import { APP_ID } from "./constants";

import { Markdown } from "@/client/apps/shared/markdown";
import ChatGPTIcon from "@/client/atoms/icons/chat-gpt";
import type { ChatModel } from "@/shared/types/openai";

interface MessageModel {
	id: string;
	content: string;
	role: "assistant" | "user";
	model?: string;
}

export const modelColors: Record<string, ColorPaletteProp> = {
	"gpt-3.5-turbo": "neutral",
	"gpt-4": "orange",
	"gpt-4-turbo": "violet",
	"gpt-4o": "blue",
};

export const modelNames: Record<string, string> = {
	"gpt-3.5-turbo": "GPT-3.5 Turbo",
	"gpt-4": "GPT-4",
	"gpt-4-turbo": "GPT-4 Turbo",
	"gpt-4o": "GPT-4o",
};

const models = Object.entries(modelNames).map(([id, label]) => ({ id, label }));

export function ChatName({
	name,
	onUpdate,
	color,
}: {
	name: string;
	onUpdate(_label: string): void;
	color: ColorPaletteProp;
}) {
	const [currentName, setCurrentName] = useState(name);
	useEffect(() => {
		setCurrentName(name);
	}, [name]);
	return (
		<Box sx={{ flex: 1, display: "flex", alignItems: "center" }}>
			<Input
				fullWidth
				color={color}
				variant="soft"
				value={currentName}
				onChange={event => {
					setCurrentName(event.target.value);
				}}
				onBlur={() => {
					if (onUpdate && currentName !== name) {
						onUpdate(currentName);
					}
				}}
			/>
		</Box>
	);
}

export function Chat({
	messages,
	color,
	firstRunReference,
}: {
	messages: MessageModel[];
	color: ColorPaletteProp;
	firstRunReference: MutableRefObject<boolean>;
}) {
	const { t } = useTranslation(["labels", "common"]);
	const reference = useRef<ListRef | null>(null);

	useEffect(() => {
		if (reference.current) {
			reference.current.scrollTo({ index: messages.length - 1, align: "bottom" });
			firstRunReference.current = false;
		}
	}, [firstRunReference, messages]);

	return (
		<Box sx={theme => ({ flex: 1, position: "relative", "--ListItem-gap": theme.spacing(1) })}>
			<AutoSizer disableWidth>
				{({ height }) => (
					<VirtualList
						ref={reference}
						itemKey="id"
						data={messages}
						height={height}
						itemHeight={56}
						styles={{
							horizontalScrollBar: {
								background: "var(--scrollbar-track-color)",
								height: 6,
							},
							verticalScrollBar: {
								background: "var(--scrollbar-track-color)",
								width: 6,
							},
							horizontalScrollBarThumb: {
								background: "var(--scrollbar-thumb-color)",
								borderRadius: 0,
							},
							verticalScrollBarThumb: {
								background: "var(--scrollbar-thumb-color)",
								borderRadius: 0,
							},
						}}
					>
						{message => (
							<ListItem
								component="div"
								sx={{
									"--ListItemDecorator-size": "56px",
									flexDirection: message.role === "user" ? "row-reverse" : "row",
									alignItems: "flex-start",
									p: 1,
								}}
							>
								<ListItemDecorator
									sx={theme => ({
										position: "sticky",
										top: theme.spacing(0.5),
									})}
								>
									<Tooltip
										title={
											message.model
												? modelNames[message.model] ??
													t(`labels:${message.role}`)
												: t(`labels:${message.role}`)
										}
									>
										<Avatar
											variant="soft"
											color={
												message.role === "user"
													? color
													: modelColors[
															message.model ?? "gpt-3.5-turbo"
														] ?? "neutral"
											}
										>
											{message.role === "user" ? (
												<PersonIcon />
											) : (
												<ChatGPTIcon />
											)}
										</Avatar>
									</Tooltip>
								</ListItemDecorator>
								<ListItemContent
									sx={{
										ml: {
											md: message.role === "user" ? 7 : 0,
											lg: message.role === "user" ? 15 : 0,
										},
										mr: {
											md: message.role === "user" ? 0 : 7,
											lg: message.role === "user" ? 0 : 15,
										},
									}}
								>
									<Sheet
										variant="soft"
										sx={{ px: 2, py: 1, borderRadius: "sm" }}
										color={message.role === "user" ? color : "neutral"}
									>
										<Markdown markdown={message.content} />
									</Sheet>
								</ListItemContent>
							</ListItem>
						)}
					</VirtualList>
				)}
			</AutoSizer>
		</Box>
	);
}

export function Assistant({ color }: { color: ColorPaletteProp }) {
	const { t } = useTranslation(["labels", "common"]);
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

	const firstRunReference = useRef(true);
	const scrollContainerReference = useRef<HTMLDivElement | null>(null);

	const { send } = useSDK<unknown, object>(APP_ID, {
		onMessage(message) {
			switch (message.action) {
				case "openai:response": {
					const {
						output,
						done,
						model: model_,
					} = message.payload as {
						output: string;
						done: boolean;
						model: string;
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
					} else {
						setIsGenerating(true);
						setMesssage(output);
					}

					break;
				}

				case "openai:messages": {
					const { chat } = message.payload as {
						chat: Except<ChatModel, "messages"> & { messages: MessageModel[] };
					};
					firstRunReference.current = true;
					setMessages(chat.messages);
					setModel(chat.model);
					setChatName(chat.label);

					break;
				}

				case "openai:error": {
					const { error: error_ } = message.payload as {
						error: string;
					};
					setError(error_);

					break;
				}

				case "openai:chats": {
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
			container.scrollTop = container.scrollHeight;
		}

		if (chatId) {
			send({ action: "openai:history", payload: { id: chatId } });
		} else {
			setChatId(v4());
		}
	}, [send, chatId]);

	useEffect(() => {
		window.ipc.send("hasOpenAiApiKey");
		const unsubscribe = window.ipc.on("hasOpenAiApiKey", (hasKey: boolean) => {
			setIsWarningOpen(!hasKey);
		});
		return () => {
			unsubscribe();
		};
	}, []);

	return (
		<Box sx={{ flex: 1, display: "flex", height: "100%" }}>
			<Snackbar
				color="danger"
				variant="outlined"
				open={Boolean(error)}
				endDecorator={
					<IconButton
						onClick={() => {
							setError("");
						}}
					>
						<CloseIcon />
					</IconButton>
				}
			>
				<Typography>{error}</Typography>
			</Snackbar>
			<Snackbar color="yellow" variant="solid" open={isWarningOpen}>
				<Typography>{t("texts:enterOpenAIAPIKey")}</Typography>
			</Snackbar>

			<Sheet
				color="neutral"
				variant="soft"
				sx={{
					overflowY: "auto",
					overflowX: "hidden",
					width: 200,
					flexShrink: 0,
				}}
			>
				<List sx={{ width: "100%" }}>
					<ListItem>
						<ListItemButton
							color={color}
							onClick={() => {
								setChatId(v4());
							}}
						>
							<ListItemDecorator>
								<AddCommentIcon />
							</ListItemDecorator>
							<ListItemContent>
								<Typography noWrap>{t("labels:newChat")}</Typography>
							</ListItemContent>
						</ListItemButton>
					</ListItem>
					{chats
						.sort((a, b) => {
							if (a.pinned && b.pinned) {
								return 0;
							}

							return a.pinned ? -1 : 1;
						})
						.map(chat => (
							<ListItem
								key={chat.id}
								sx={{
									"& .MuiListItem-endAction": {
										mr: -0.75,
									},
								}}
								endAction={
									<Dropdown>
										<MenuButton
											aria-label={t("common:menu")}
											slots={{ root: IconButton }}
											slotProps={{
												root: {
													variant: "plain",
													color: "neutral",
													sx: {
														"&:focus-visible": {
															zIndex: "unset",
															outlineOffset: -2,
														},
													},
												},
											}}
										>
											<MoreVertIcon />
										</MenuButton>
										<Menu color="neutral" variant="plain">
											<MenuItem
												onClick={() => {
													send({
														action: "openai:update",
														payload: {
															id: chat.id,
															update: { pinned: !chat.pinned },
														},
													});
												}}
											>
												<ListItemDecorator
													sx={theme => ({
														"--Icon-color": chat.pinned
															? theme.vars.palette.primary["500"]
															: "currentColor",
													})}
												>
													<PushPinIcon />
												</ListItemDecorator>{" "}
												{t("labels:pin")}
											</MenuItem>
											<MenuItem
												onClick={() => {
													send({
														action: "openai:update",
														payload: {
															id: chat.id,
															update: {
																favorite: !chat.favorite,
															},
														},
													});
												}}
											>
												<ListItemDecorator
													sx={theme => ({
														"--Icon-color": chat.favorite
															? theme.vars.palette.primary["500"]
															: "currentColor",
													})}
												>
													<StarIcon />
												</ListItemDecorator>{" "}
												{t("labels:favorite")}
											</MenuItem>
											<MenuItem
												onClick={() => {
													send({
														action: "openai:delete",
														payload: { id: chat.id },
													});
												}}
											>
												<ListItemDecorator
													sx={theme => ({
														"--Icon-color":
															theme.vars.palette.red["500"],
													})}
												>
													<DeleteForeverIcon />
												</ListItemDecorator>{" "}
												{t("labels:delete")}
											</MenuItem>
										</Menu>
									</Dropdown>
								}
							>
								<ListItemButton
									selected={chatId === chat.id}
									color={color}
									sx={{
										"&.Mui-focusVisible": {
											zIndex: "unset",
											outlineOffset: -2,
										},
									}}
									onClick={() => {
										setChatId(chat.id);
									}}
								>
									<Typography noWrap>{chat.label}</Typography>
								</ListItemButton>
							</ListItem>
						))}
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
				<Sheet color={color} variant="soft" sx={{ py: 0.75, px: 1 }}>
					<Box sx={{ display: "flex", gap: 1, width: "100%" }}>
						<Select
							color={color}
							variant="soft"
							value={model}
							sx={{ width: 250 }}
							renderValue={option =>
								option && (
									<Box
										sx={{
											"--ListItemDecorator-size": "48px",
											display: "flex",
											alignItems: "center",
										}}
									>
										<ListItemDecorator>
											<Avatar
												size="sm"
												color={modelColors[option.value] ?? "neutral"}
											>
												<ChatGPTIcon />
											</Avatar>
										</ListItemDecorator>
										<ListItemContent>
											{modelNames[option.value] ?? option.value}
										</ListItemContent>
									</Box>
								)
							}
							onChange={(_event, value) => {
								if (value) {
									setModel(value);
								}
							}}
						>
							{models.map(model => (
								<Option
									key={model.id}
									value={model.id}
									sx={{
										"--ListItemDecorator-size": "48px",
									}}
								>
									<ListItemDecorator>
										<Avatar
											size="sm"
											color={modelColors[model.id] ?? "neutral"}
										>
											<ChatGPTIcon />
										</Avatar>
									</ListItemDecorator>
									<ListItemContent>{model.label}</ListItemContent>
								</Option>
							))}
						</Select>
						<ChatName
							name={chatName}
							color={color}
							onUpdate={label => {
								send({
									action: "openai:update",
									payload: {
										id: chatId,
										update: { label },
									},
								});
							}}
						/>
					</Box>
				</Sheet>
				<Chat
					color={color}
					firstRunReference={firstRunReference}
					messages={useMemo(
						() =>
							[
								...messages,
								message
									? {
											id: "newMessage",
											content: message,
											role: "assistant",
											model,
										}
									: null,
							].filter(Boolean) as MessageModel[],
						[messages, message]
					)}
				/>
				<Box sx={{ p: 1 }}>
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
									setIsGenerating(true);
									setInput("");
									setMessages(previousState => [
										...previousState,
										{ role: "user", content: input.trim(), id: v4() },
									]);
									send({
										action: "openai:chat",
										payload: {
											input: input.trim(),
											id: chatId,
											model,
											maxHistory: 10,
										},
									});
								}}
							>
								<SendIcon />
							</IconButton>
						}
						onChange={event => {
							setInput(event.target.value);
						}}
						onKeyDown={event => {
							if (event.key === "Enter" && !event.shiftKey) {
								event.preventDefault();
								setIsGenerating(true);
								setInput("");
								setMessages(previousState => [
									...previousState,
									{ role: "user", content: input.trim(), id: v4() },
								]);
								send({
									action: "openai:chat",
									payload: {
										input: input.trim(),
										id: chatId,
										model,
										maxHistory: 10,
									},
								});
							}
						}}
					/>
				</Box>
			</Box>
		</Box>
	);
}
