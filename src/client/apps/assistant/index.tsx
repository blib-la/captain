import { useSDK } from "@captn/react/use-sdk";
import AddCommentIcon from "@mui/icons-material/AddComment";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import AssistantIcon from "@mui/icons-material/Assistant";
import CloseIcon from "@mui/icons-material/Close";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import GoogleIcon from "@mui/icons-material/Google";
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
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import type { Except } from "type-fest";
import { v4 } from "uuid";

import { APP_ID } from "./constants";

import { Markdown } from "@/client/apps/shared/markdown";
import AnthropicIcon from "@/client/atoms/icons/anthropic";
import ChatGPTIcon from "@/client/atoms/icons/chat-gpt";
import MistralIcon from "@/client/atoms/icons/mistral";
import type { ChatModel } from "@/shared/types/openai";

interface MessageModel {
	id: string;
	content: string;
	role: "assistant" | "user";
	model?: string;
}

export const modelColors: Record<string, ColorPaletteProp> = {
	"gpt-3.5-turbo": "neutral",
	"gpt-4": "teal",
	"gpt-4-turbo": "violet",
	"gpt-4o": "blue",
	"claude-3-haiku-20240307": "neutral",
	"claude-3-sonnet-20240229": "teal",
	"claude-3-opus-20240229": "blue",
	"mistral-small-latest": "neutral",
	"mistral-large-latest": "teal",
	"models/gemini-1.5-pro-latest": "neutral",
};

export const modelNames: Record<string, string> = {
	"gpt-3.5-turbo": "GPT-3.5 Turbo",
	"gpt-4": "GPT-4",
	"gpt-4-turbo": "GPT-4 Turbo",
	"gpt-4o": "GPT-4o",
	"claude-3-haiku-20240307": "Claude Haiku",
	"claude-3-sonnet-20240229": "Claude Sonnet",
	"claude-3-opus-20240229": "Claude Opus",
	"mistral-small-latest": "Mistral Small",
	"mistral-large-latest": "Mistral Large",
	"models/gemini-1.5-pro-latest": "Gemini 1.5 PRO",
};

const assistantIcons: Record<string, ReactNode> = {
	gpt: <ChatGPTIcon />,
	claude: <AnthropicIcon />,
	mistral: <MistralIcon />,
	"models/gemini": <GoogleIcon />,
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
	const [showScrollToBottom, setShowScrollToBottom] = useState(false);

	const firstRunReference = useRef(true);
	const scrollContainerReference = useRef<HTMLDivElement | null>(null);

	const [modelPrefix] = model.split("-");

	let apiKeyGetter = "";
	let provider = "";

	switch (modelPrefix) {
		case "gpt": {
			apiKeyGetter = "hasOpenAiApiKey";
			provider = "OpenAI";
			break;
		}

		case "claude": {
			apiKeyGetter = "hasAnthropicApiKey";
			provider = "Anthropic";
			break;
		}

		case "mistral": {
			apiKeyGetter = "hasMistralApiKey";
			provider = "Mistral";
			break;
		}

		case "models/gemini": {
			apiKeyGetter = "hasGoogleGenerativeAiApiKey";
			provider = "Google";
			break;
		}

		default: {
			break;
		}
	}

	const { send } = useSDK<unknown, object>(APP_ID, {
		onMessage(message) {
			switch (message.action) {
				case "assistant:response": {
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

				case "assistant:messages": {
					const { chat } = message.payload as {
						chat: Except<ChatModel, "messages"> & { messages: MessageModel[] };
					};
					firstRunReference.current = true;
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
			setChatId(v4());
			setChatName("New Chat");
		}
	}, [send, chatId]);

	useEffect(() => {
		if (!apiKeyGetter) {
			return;
		}

		console.log("checking", apiKeyGetter);

		window.ipc.send(apiKeyGetter);
		const unsubscribe = window.ipc.on(apiKeyGetter, (hasKey: boolean) => {
			console.log("checked", apiKeyGetter, hasKey);
			setIsWarningOpen(!hasKey);
		});
		return () => {
			unsubscribe();
		};
	}, [apiKeyGetter]);

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
			<Snackbar color="warning" variant="solid" open={isWarningOpen}>
				<Typography>{t("texts:enterCommonAPIKey", { provider })}</Typography>
			</Snackbar>

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
					<ListItem variant="soft">
						<ListItemButton
							color={color}
							onClick={() => {
								setChatId(v4());
								setChatName("New Chat");
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
				</List>
				<List
					sx={{
						flex: 1,
						width: "100%",
						overflowY: "auto",
						overflowX: "hidden",
						flexShrink: 0,
					}}
				>
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
														action: "assistant:update",
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
														action: "assistant:update",
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
														action: "assistant:delete",
														payload: { id: chat.id },
													});

													if (chat.id === chatId) {
														setChatId(v4());
														setChatName("New Chat");
													}
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
				<Sheet color="neutral" variant="soft" sx={{ py: 0.75, px: 1 }}>
					<Box sx={{ display: "flex", gap: 1, width: "100%" }}>
						<Select
							color="neutral"
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
												{assistantIcons[modelPrefix] ?? <AssistantIcon />}
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
							{models.map(model_ => {
								const [modelPrefix_] = model_.id.split("-");

								return (
									<Option
										key={model_.id}
										value={model_.id}
										sx={{
											"--ListItemDecorator-size": "48px",
										}}
									>
										<ListItemDecorator>
											<Avatar
												size="sm"
												color={modelColors[model_.id] ?? "neutral"}
											>
												{assistantIcons[modelPrefix_] ?? <AssistantIcon />}
											</Avatar>
										</ListItemDecorator>
										<ListItemContent>{model_.label}</ListItemContent>
									</Option>
								);
							})}
						</Select>
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
					</Box>
				</Sheet>
				<Box
					ref={scrollContainerReference}
					sx={{
						flex: 1,
						overflowY: "auto",
						overflowX: "hidden",
						maxWidth: "100%",
					}}
					onScroll={event => {
						const container = event.target as HTMLDivElement;
						const threshold = 200;
						const isNearBottom =
							container.scrollHeight - container.scrollTop - container.clientHeight <
							threshold;
						setShowScrollToBottom(!isNearBottom);
					}}
				>
					<List
						sx={{
							"--ListItemDecorator-size": "56px",
							flexShrink: 0,
							width: "100%",
							justifyContent: "flex-end",
						}}
					>
						{messages.map(message_ => {
							const [modelPrefix_] = (message_.model ?? "unknown").split("-");
							return (
								<ListItem
									key={message_.id}
									sx={{
										flexDirection:
											message_.role === "user" ? "row-reverse" : "row",
										alignItems: "flex-start",
										alignSelf:
											message_.role === "user" ? "flex-end" : "flex-start",
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
												message_.model
													? modelNames[message_.model] ??
														t(`labels:${message_.role}`)
													: t(`labels:${message_.role}`)
											}
										>
											<Avatar
												variant="soft"
												color={
													message_.role === "user"
														? color
														: modelColors[
																message_.model ?? "gpt-3.5-turbo"
															] ?? "neutral"
												}
											>
												{message_.role === "user" ? (
													<PersonIcon />
												) : (
													assistantIcons[modelPrefix_] ?? (
														<AssistantIcon />
													)
												)}
											</Avatar>
										</Tooltip>
									</ListItemDecorator>
									<ListItemContent>
										<Sheet
											variant="soft"
											sx={{ px: 2, py: 1, borderRadius: "sm" }}
											color={message_.role === "user" ? color : "neutral"}
										>
											<Markdown markdown={message_.content} />
										</Sheet>
									</ListItemContent>
								</ListItem>
							);
						})}
						{message && (
							<ListItem
								sx={{
									flexDirection: "row",
									alignItems: "flex-start",
								}}
							>
								<ListItemDecorator sx={{ position: "sticky", top: 0 }}>
									<Avatar color={modelColors[model] ?? "neutral"} variant="soft">
										{assistantIcons[modelPrefix] ?? <AssistantIcon />}
									</Avatar>
								</ListItemDecorator>
								<ListItemContent
									sx={{
										mr: 16,
									}}
								>
									<Sheet
										color="neutral"
										variant="soft"
										sx={{ px: 2, py: 1, borderRadius: "sm" }}
									>
										<Markdown markdown={message} />
									</Sheet>
								</ListItemContent>
							</ListItem>
						)}
					</List>
				</Box>
				<Box sx={{ p: 1, position: "relative" }}>
					<Box
						sx={{
							position: "absolute",
							bottom: "100%",
							left: "50%",
							transform: "translateX(-50%)",
							display: showScrollToBottom ? "flex" : "none",
						}}
					>
						<IconButton
							color={color}
							variant="soft"
							aria-label={t("labels:toEnd")}
							onClick={() => {
								const container = scrollContainerReference.current;
								if (container) {
									container.scrollTop = container.scrollHeight;
								}
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
									action: "assistant:chat",
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
