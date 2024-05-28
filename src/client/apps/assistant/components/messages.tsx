import AssistantIcon from "@mui/icons-material/Assistant";
import PersonIcon from "@mui/icons-material/Person";
import Avatar from "@mui/joy/Avatar";
import List from "@mui/joy/List";
import ListItem from "@mui/joy/ListItem";
import ListItemContent from "@mui/joy/ListItemContent";
import ListItemDecorator from "@mui/joy/ListItemDecorator";
import Sheet from "@mui/joy/Sheet";
import type { ColorPaletteProp } from "@mui/joy/styles";
import Tooltip from "@mui/joy/Tooltip";
import { useTranslation } from "next-i18next";

import { StreamingMessage } from "@/client/apps/assistant/components/streaming-message";
import { modelColors, modelNames } from "@/client/apps/assistant/constants";
import { assistantIcons } from "@/client/apps/assistant/icons";
import type { MessageModel } from "@/client/apps/assistant/types";
import { Markdown } from "@/client/apps/shared/markdown";

export function Messages({
	messages,
	model,
	modelPrefix,
	message,
	color,
}: {
	messages: MessageModel[];
	model: string;
	modelPrefix: string;
	message: string;
	color: ColorPaletteProp;
}) {
	const { t } = useTranslation(["labels"]);
	return (
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
							flexDirection: message_.role === "user" ? "row-reverse" : "row",
							alignItems: "flex-start",
							alignSelf: message_.role === "user" ? "flex-end" : "flex-start",
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
										? modelNames[message_.model] ?? t(`labels:${message_.role}`)
										: t(`labels:${message_.role}`)
								}
							>
								<Avatar
									variant="soft"
									color={
										message_.role === "user"
											? color
											: modelColors[message_.model ?? "gpt-3.5-turbo"] ??
												"neutral"
									}
								>
									{message_.role === "user" ? (
										<PersonIcon />
									) : (
										assistantIcons[modelPrefix_] ?? <AssistantIcon />
									)}
								</Avatar>
							</Tooltip>
						</ListItemDecorator>
						<ListItemContent>
							<Sheet
								variant="soft"
								color={message_.role === "user" ? color : "neutral"}
								sx={{
									px: 2,
									py: 1,
									borderRadius: "sm",
								}}
							>
								<Markdown markdown={message_.content} />
							</Sheet>
						</ListItemContent>
					</ListItem>
				);
			})}
			<StreamingMessage message={message} model={model} modelPrefix={modelPrefix} />
		</List>
	);
}
