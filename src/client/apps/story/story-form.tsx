import { CustomScrollbars } from "@captn/joy/custom-scrollbars";
import { useSDK } from "@captn/react/use-sdk";
import WarningIcon from "@mui/icons-material/Warning";
import Alert from "@mui/joy/Alert";
import Box from "@mui/joy/Box";
import Button from "@mui/joy/Button";
import FormControl from "@mui/joy/FormControl";
import FormLabel from "@mui/joy/FormLabel";
import Option from "@mui/joy/Option";
import Select from "@mui/joy/Select";
import Stack from "@mui/joy/Stack";
import Textarea from "@mui/joy/Textarea";
import Typography from "@mui/joy/Typography";
import { useAtom } from "jotai/index";
import { useTranslation } from "next-i18next";
import { Controller, useForm } from "react-hook-form";

import { selectedStoryImagesAtom } from "./atoms";
import { SelectedImages } from "./components";
import { APP_ID } from "./constants";

import type { FormInput } from "#/types/story";

export function StoryForm({
	hasOpenAiApiKey,
	disabled,
	onSubmit,
}: {
	onSubmit?(): void;
	disabled?: boolean;
	hasOpenAiApiKey?: boolean;
}) {
	const {
		t,
		i18n: { language: locale },
	} = useTranslation(["labels", "texts"]);
	const { handleSubmit, register, control, watch } = useForm<FormInput>({
		defaultValues: {
			length: "short",
			style: "magicalMystery",
			customStyle: "",
			characters: "",
			mood: "exciting",
		},
	});
	const [images] = useAtom(selectedStoryImagesAtom);

	const style = watch("style");

	const { send } = useSDK(APP_ID, {});

	return (
		<Stack
			component="form"
			gap={2}
			sx={{ flex: 1 }}
			onSubmit={handleSubmit(data => {
				if (onSubmit) {
					onSubmit();
				}

				send({
					action: "story:create",
					payload: { images: images.map(image => image.filePath), locale, options: data },
				});
			})}
		>
			<Box sx={{ flex: 1, position: "relative" }}>
				<CustomScrollbars>
					{!hasOpenAiApiKey && (
						<Alert
							color="warning"
							variant="soft"
							startDecorator={<WarningIcon />}
							slotProps={{ startDecorator: { sx: { alignSelf: "flexStart" } } }}
							sx={{ mb: 2 }}
						>
							<Typography>
								{t("common:pages.dataset.enterKeyToUseGPTVision")}
							</Typography>
						</Alert>
					)}
					<Typography sx={{ mb: 2 }}>{t("texts:storyFormIntroduction")}</Typography>
					<FormControl required>
						<FormLabel>{t("labels:formLabel.length")}</FormLabel>
						<Controller
							name="length"
							control={control}
							render={({ field: { onChange, ...field } }) => (
								<Select
									{...field}
									required
									onChange={(event, value) => {
										onChange({ target: { value } });
									}}
								>
									<Option value="short">{t("labels:length.short")}</Option>
									<Option value="medium">{t("labels:length.medium")}</Option>
									<Option value="long">{t("labels:length.long")}</Option>
								</Select>
							)}
						/>
					</FormControl>
					<FormControl required>
						<FormLabel>{t("labels:formLabel.mood")}</FormLabel>
						<Controller
							name="mood"
							control={control}
							render={({ field: { onChange, ...field } }) => (
								<Select
									{...field}
									required
									onChange={(event, value) => {
										onChange({ target: { value } });
									}}
								>
									<Option value="joyful">{t("labels:mood.joyful")}</Option>
									<Option value="sad">{t("labels:mood.sad")}</Option>
									<Option value="suspenseful">
										{t("labels:mood.suspenseful")}
									</Option>
									<Option value="relaxing">{t("labels:mood.relaxing")}</Option>
									<Option value="exciting">{t("labels:mood.exciting")}</Option>
								</Select>
							)}
						/>
					</FormControl>
					<FormControl required>
						<FormLabel>{t("labels:formLabel.styleTheme")}</FormLabel>
						<Controller
							name="style"
							control={control}
							render={({ field: { onChange, ...field } }) => (
								<Select
									{...field}
									required
									onChange={(event, value) => {
										onChange({ target: { value } });
									}}
								>
									<Option value="magicalMystery">
										{t("labels:style.magicalMystery")}
									</Option>
									<Option value="adventure">{t("labels:style.adventure")}</Option>
									<Option value="sciFi">{t("labels:style.sciFi")}</Option>
									<Option value="historical">
										{t("labels:style.historical")}
									</Option>
									<Option value="custom">{t("labels:style.custom")}</Option>
								</Select>
							)}
						/>
					</FormControl>
					<FormControl
						sx={{
							display: style === "custom" ? undefined : "none",
						}}
					>
						<FormLabel>{t("labels:formLabel.customStyle")}</FormLabel>
						<Textarea
							disabled={style !== "custom"}
							{...register("customStyle", { required: style === "custom" })}
							placeholder={t("labels:placeholder.customStyle")}
						/>
					</FormControl>
					<FormControl>
						<FormLabel>{t("labels:formLabel.characters")}</FormLabel>
						<Textarea
							{...register("characters")}
							placeholder={t("labels:placeholder.characters")}
						/>
					</FormControl>
					<Box sx={{ py: 1 }}>
						<SelectedImages />
					</Box>
				</CustomScrollbars>
			</Box>
			<Box>
				<Button fullWidth disabled={disabled} type="submit" color="primary" variant="solid">
					{t("labels:submitButtonText")}
				</Button>
			</Box>
		</Stack>
	);
}
