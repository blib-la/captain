import { useSDK } from "@captn/react/use-sdk";
import AssistantIcon from "@mui/icons-material/Assistant";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import PersonIcon from "@mui/icons-material/Person";
import SendIcon from "@mui/icons-material/Send";
import Avatar from "@mui/joy/Avatar";
import Box from "@mui/joy/Box";
import IconButton from "@mui/joy/IconButton";
import List from "@mui/joy/List";
import ListItem from "@mui/joy/ListItem";
import ListItemContent from "@mui/joy/ListItemContent";
import ListItemDecorator from "@mui/joy/ListItemDecorator";
import Sheet from "@mui/joy/Sheet";
import Textarea from "@mui/joy/Textarea";
import { useTranslation } from "next-i18next";
import { useEffect, useRef, useState } from "react";
import { v4 } from "uuid";

import { APP_ID } from "./constants";

import { Markdown } from "@/client/apps/shared/markdown";

interface MessageModel {
	id: string;
	content: string;
	role: "assistant" | "user";
}

export function Assistant() {
	const { t } = useTranslation(["labels", "common"]);
	const [messages, setMessages] = useState<MessageModel[]>([]);
	const [message, setMesssage] = useState("");
	const [isGenerating, setIsGenerating] = useState(false);
	const [input, setInput] = useState("");

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
					const { messages: history } = message.payload as {
						messages: MessageModel[];
					};
					firstRunReference.current = true;
					setMessages(history);

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

		send({ action: "openai:history", payload: {} });
	}, [send]);

	return (
		<>
			<Box sx={{ position: "absolute", zIndex: 2, top: 0, right: 0, m: 1 }}>
				<IconButton
					color="danger"
					variant="solid"
					aria-label={t("labels:clear")}
					onClick={() => {
						send({ action: "openai:clear", payload: {} });
					}}
				>
					<DeleteForeverIcon />
				</IconButton>
			</Box>
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
						// Overflow: "hidden",
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
							<ListItemDecorator sx={{ position: "sticky", top: 0 }}>
								<Avatar>
									{message_.role === "user" ? <PersonIcon /> : <AssistantIcon />}
								</Avatar>
							</ListItemDecorator>
							<ListItemContent
								sx={{
									ml: message_.role === "user" ? 16 : 0,
									mr: message_.role === "user" ? 0 : 16,
								}}
							>
								<Sheet
									color={message_.role === "user" ? "violet" : "blue"}
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
									<AssistantIcon />
								</Avatar>
							</ListItemDecorator>
							<ListItemContent
								sx={{
									mr: 16,
								}}
							>
								<Sheet
									color="blue"
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
			<Box>
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
							color="primary"
							onClick={() => {
								setIsGenerating(true);
								setInput("");
								setMessages(previousState => [
									...previousState,
									{ role: "user", content: input.trim(), id: v4() },
								]);
								send({ action: "openai:chat", payload: { input: input.trim() } });
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
		</>
	);
}
