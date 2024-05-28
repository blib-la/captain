import AssistantIcon from "@mui/icons-material/Assistant";
import Avatar from "@mui/joy/Avatar";
import Box from "@mui/joy/Box";
import ListItemContent from "@mui/joy/ListItemContent";
import ListItemDecorator from "@mui/joy/ListItemDecorator";
import Option from "@mui/joy/Option";
import Select from "@mui/joy/Select";
import { useTranslation } from "next-i18next";

import { modelColors, modelNames, models } from "@/client/apps/assistant/constants";
import { assistantIcons } from "@/client/apps/assistant/icons";

export function ModelSelector({
	model,
	modelPrefix,
	onModelSelect,
}: {
	model: string;
	modelPrefix: string;
	onModelSelect(model: string): void;
}) {
	const { t } = useTranslation(["labels", "common"]);
	return (
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
							<Avatar size="sm" color={modelColors[option.value] ?? "neutral"}>
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
					onModelSelect(value);
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
							<Avatar size="sm" color={modelColors[model_.id] ?? "neutral"}>
								{assistantIcons[modelPrefix_] ?? <AssistantIcon />}
							</Avatar>
						</ListItemDecorator>
						<ListItemContent>{model_.label}</ListItemContent>
					</Option>
				);
			})}
		</Select>
	);
}
