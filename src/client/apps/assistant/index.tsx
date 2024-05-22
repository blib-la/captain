import { useSDK } from "@captn/react/use-sdk";
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
import type { ColorPaletteProp } from "@mui/joy/styles";
import Textarea from "@mui/joy/Textarea";
import Typography from "@mui/joy/Typography";
import { useTranslation } from "next-i18next";
import { useEffect, useRef, useState } from "react";
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
}

const models = [
	{
		id: "gpt-3.5-turbo",
		label: "GPT-3.5 Turbo",
	},
	{
		id: "gpt-4-turbo",
		label: "GPT-4 Turbo",
	},
	{
		id: "gpt-4",
		label: "GPT-4",
	},
	{
		id: "gpt-4o",
		label: "GPT-4o",
	},
];

export function Assistant({ color }: { color: ColorPaletteProp }) {
	const { t } = useTranslation(["labels", "common"]);
	const [messages, setMessages] = useState<MessageModel[]>([]);
	const [message, setMesssage] = useState("");
	const [isGenerating, setIsGenerating] = useState(false);
	const [input, setInput] = useState("");
	const [chatId, setChatId] = useState("");
	const [model, setModel] = useState(models[0].id);
	const [chats, setChats] = useState<(Except<ChatModel, "messages"> & { id: string })[]>([]);

	const firstRunReference = useRef(true);
	const scrollContainerReference = useRef<HTMLDivElement | null>(null);

	const { send } = useSDK<unknown, object>(APP_ID, {
		onMessage(message) {
			switch (message.action) {
				case "openai:response": {
					const { output, done } = message.payload as {
						output: string;
						done: boolean;
					};
					if (done) {
						setMesssage("");
						setMessages(previousState => [
							...previousState,
							{ role: "assistant", content: output, id: v4() },
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
			send({ action: "openai:history", payload: { id: chatId } });
		} else {
			setChatId(v4());
		}
	}, [send, chatId]);

	return (
		<Box sx={{ flex: 1, display: "flex", height: "100%" }}>
			<Sheet
				color="neutral"
				variant="soft"
				sx={{
					overflowY: "auto",
					overflowX: "hidden",
					width: 200,
				}}
			>
				<List sx={{ width: "100%" }}>
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
			<Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
				<Sheet color={color} variant="soft" sx={{ py: 0.75, px: 1 }}>
					<Box sx={{ display: "flex" }}>
						<Select
							value={model}
							onChange={(_event, value) => {
								if (value) {
									setModel(value);
								}
							}}
						>
							{models.map(model => (
								<Option key={model.id} value={model.id}>
									{model.label}
								</Option>
							))}
						</Select>
					</Box>
				</Sheet>
				<Box
					ref={scrollContainerReference}
					sx={{
						flex: 1,
						overflowY: "auto",
						overflowX: "hidden",
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
						{messages.map(message_ => (
							<ListItem
								key={message_.id}
								sx={{
									flexDirection: message_.role === "user" ? "row-reverse" : "row",
									alignItems: "flex-start",
								}}
							>
								<ListItemDecorator
									sx={theme => ({
										position: "sticky",
										top: theme.spacing(0.5),
									})}
								>
									<Avatar
										color={message_.role === "user" ? color : "neutral"}
										variant="soft"
									>
										{message_.role === "user" ? (
											<PersonIcon />
										) : (
											<ChatGPTIcon />
										)}
									</Avatar>
								</ListItemDecorator>
								<ListItemContent
									sx={{
										ml: message_.role === "user" ? 16 : 0,
										mr: message_.role === "user" ? 0 : 16,
									}}
								>
									<Sheet
										color={message_.role === "user" ? color : "neutral"}
										variant="soft"
										sx={{ px: 2, py: 1, borderRadius: "sm" }}
									>
										<Markdown markdown={message_.content} />
									</Sheet>
								</ListItemContent>
							</ListItem>
						))}
						{message && (
							<ListItem
								sx={{
									flexDirection: "row",
									alignItems: "flex-start",
								}}
							>
								<ListItemDecorator sx={{ position: "sticky", top: 0 }}>
									<Avatar>
										<ChatGPTIcon />
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
					/>
				</Box>
			</Box>
		</Box>
	);
}
