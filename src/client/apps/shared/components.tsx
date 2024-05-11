import FormControl from "@mui/joy/FormControl";
import FormLabel from "@mui/joy/FormLabel";
import Option from "@mui/joy/Option";
import Select from "@mui/joy/Select";
import Sheet from "@mui/joy/Sheet";
import Textarea from "@mui/joy/Textarea";
import Typography from "@mui/joy/Typography";
import { useTranslation } from "next-i18next";

import type { IllustrationStyles } from "./illustration-styles";
import { illustrationStyles } from "./illustration-styles";

import { FlagUs } from "@/client/atoms/flags/us";

export interface PromptSheetProperties {
	illustrationStyle: IllustrationStyles;
	prompt: string;
	onIllustrationStyleChange(value: IllustrationStyles): void;
	onPromptChange(value: string): void;
}

export function PromptSheet({
	illustrationStyle,
	prompt,
	onIllustrationStyleChange,
	onPromptChange,
}: PromptSheetProperties) {
	const { t } = useTranslation(["common", "labels"]);
	return (
		<Sheet
			variant="soft"
			sx={{
				display: "flex",
				gap: 1,
				flexDirection: { xs: "column", md: "row" },
				px: 1,
				py: 2,
			}}
		>
			<FormControl sx={{ minWidth: 200 }}>
				<FormLabel>{t("labels:artStyle")}</FormLabel>
				<Select
					value={illustrationStyle}
					renderValue={option =>
						option && (
							<Typography>
								{t(`labels:illustrationStyles.${option.value}`)}
							</Typography>
						)
					}
					onChange={(_event, value_) => {
						if (value_) {
							onIllustrationStyleChange(value_);
						}
					}}
				>
					{Object.entries(illustrationStyles).map(([key_]) => (
						<Option
							key={key_}
							value={key_}
							sx={{ flexDirection: "column", alignItems: "stretch" }}
						>
							<Typography>{t(`labels:illustrationStyles.${key_}`)}</Typography>
							{key_ === "custom" && (
								<Typography level="body-xs" component="div">
									{t(`labels:illustrationStyles.customInfo`)}
								</Typography>
							)}
						</Option>
					))}
				</Select>
			</FormControl>
			<FormControl sx={{ flex: 1 }}>
				<FormLabel>{t("labels:prompt")}</FormLabel>
				<Textarea
					minRows={3}
					maxRows={3}
					value={prompt}
					startDecorator={
						<Typography startDecorator={<FlagUs />} level="body-xs">
							{t("labels:promptInfo")}
						</Typography>
					}
					onChange={event => {
						onPromptChange(event.target.value);
					}}
				/>
			</FormControl>
		</Sheet>
	);
}
