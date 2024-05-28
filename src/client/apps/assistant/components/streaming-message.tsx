import AssistantIcon from "@mui/icons-material/Assistant";
import Avatar from "@mui/joy/Avatar";
import ListItem from "@mui/joy/ListItem";
import ListItemContent from "@mui/joy/ListItemContent";
import ListItemDecorator from "@mui/joy/ListItemDecorator";
import Sheet from "@mui/joy/Sheet";

import { modelColors } from "@/client/apps/assistant/constants";
import { assistantIcons } from "@/client/apps/assistant/icons";
import { Markdown } from "@/client/apps/shared/markdown";

export function StreamingMessage({
	message,
	model,
	modelPrefix,
}: {
	message: string;
	model: string;
	modelPrefix: string;
}) {
	return (
		message && (
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
					<Sheet color="neutral" variant="soft" sx={{ px: 2, py: 1, borderRadius: "sm" }}>
						<Markdown markdown={message} />
					</Sheet>
				</ListItemContent>
			</ListItem>
		)
	);
}
