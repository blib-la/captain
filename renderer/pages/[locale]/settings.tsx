import Box from "@mui/joy/Box";
import Card from "@mui/joy/Card";
import CardContent from "@mui/joy/CardContent";
import Container from "@mui/joy/Container";
import List from "@mui/joy/List";
import ListItem from "@mui/joy/ListItem";
import ListItemContent from "@mui/joy/ListItemContent";
import ListItemDecorator from "@mui/joy/ListItemDecorator";
import Sheet from "@mui/joy/Sheet";
import Stack from "@mui/joy/Stack";
import Typography from "@mui/joy/Typography";
import type { InferGetStaticPropsType } from "next";
import Head from "next/head";
import { useTranslation } from "next-i18next";
import { useEffect, useState } from "react";
import useSWR from "swr";

import { OPENAI_API_KEY, STABLE_DIFFUSION_SETTINGS } from "../../../main/helpers/constants";

import { makeStaticProperties } from "@/ions/i18n/get-static";
import { ColorModeSelector } from "@/organisms/color-mode-selector";
import { CustomScrollbars } from "@/organisms/custom-scrollbars";
import { FolderField } from "@/organisms/folder-field";
import { LanguageSelect } from "@/organisms/language-select";
import { PasswordField } from "@/organisms/password-field";

export function UserPreferences() {
	const { t } = useTranslation(["common"]);
	return (
		<Card variant="soft">
			<Typography>{t("common:pages.settings.userPreferences")}</Typography>
			<CardContent>
				<List>
					<ListItem>
						<ListItemContent>
							<Typography level="title-sm">
								{t("common:pages.settings.colorMode")}
							</Typography>
							<Typography level="body-sm">
								{t("common:pages.settings.colorModeDescription")}
							</Typography>
						</ListItemContent>
						<ListItemDecorator sx={{ width: 172, flexShrink: 0 }}>
							<ColorModeSelector />
						</ListItemDecorator>
					</ListItem>
					<ListItem>
						<ListItemContent>
							<Typography level="title-sm">
								{t("common:pages.settings.languageSettings")}
							</Typography>
							<Typography level="body-sm">
								{t("common:pages.settings.languageSettingsDescription")}
							</Typography>
						</ListItemContent>
						<ListItemDecorator sx={{ width: 172, flexShrink: 0 }}>
							<LanguageSelect />
						</ListItemDecorator>
					</ListItem>
				</List>
			</CardContent>
		</Card>
	);
}

export function OpenAISettings() {
	const { t } = useTranslation(["common"]);
	const [openAiApiKey, setOpenAiApiKey] = useState("");

	const { data } = useSWR(OPENAI_API_KEY);

	useEffect(() => {
		if (data) {
			setOpenAiApiKey(data);
		}
	}, [data]);

	return (
		<Card variant="soft">
			<Typography>{t("common:pages.settings.openAiSettings")}</Typography>
			<CardContent>
				<List>
					<ListItem>
						<ListItemContent>
							<Typography level="title-sm">{t("common:openAiApiKey")}</Typography>
							<Typography level="body-sm">
								{t("common:pages.settings.openAiApiKeyDescription")}
							</Typography>
						</ListItemContent>
						<ListItemDecorator sx={{ width: 288, flexShrink: 0 }}>
							<PasswordField
								fullWidth
								aria-label={t("common:openAiApiKey")}
								value={openAiApiKey}
								onChange={event => {
									setOpenAiApiKey(event.target.value);
								}}
								onBlur={event => {
									window.ipc.fetch(OPENAI_API_KEY, {
										method: "POST",
										data: event.target.value,
									});
								}}
							/>
						</ListItemDecorator>
					</ListItem>
				</List>
			</CardContent>
		</Card>
	);
}

export function StableDiffusionSettings() {
	const { t } = useTranslation(["common"]);
	const [sdSettings, setSdSettings] = useState({ checkpoints: "", loras: "" });

	const { data } = useSWR(STABLE_DIFFUSION_SETTINGS);

	useEffect(() => {
		if (data) {
			setSdSettings(data);
		}
	}, [data]);

	return (
		<Card variant="soft">
			<Typography>{t("common:pages.settings.stableDiffusionSettings")}</Typography>
			<CardContent>
				<List>
					<ListItem>
						<ListItemContent>
							<Typography level="title-sm">
								{t("common:pages.settings.stableDiffusionCheckpoints")}
							</Typography>
							<Typography level="body-sm">
								{t("common:pages.settings.stableDiffusionCheckpointsDescription")}
							</Typography>
						</ListItemContent>
						<ListItemDecorator sx={{ width: 288, flexShrink: 0 }}>
							<FolderField
								fullWidth
								aria-label={t("common:checkpoints")}
								value={sdSettings.checkpoints}
								onChange={event => {
									setSdSettings(previousValue => ({
										...previousValue,
										checkpoints: event.target.value,
									}));
								}}
								onSelect={async value => {
									await window.ipc.fetch(STABLE_DIFFUSION_SETTINGS, {
										method: "PATCH",
										data: { checkpoints: value },
									});
									setSdSettings(previousValue => ({
										...previousValue,
										checkpoints: value,
									}));
								}}
								onBlur={event => {
									window.ipc.fetch(STABLE_DIFFUSION_SETTINGS, {
										method: "PATCH",
										data: { checkpoints: event.target.value },
									});
								}}
							/>
						</ListItemDecorator>
					</ListItem>
					<ListItem>
						<ListItemContent>
							<Typography level="title-sm">
								{t("common:pages.settings.stableDiffusionLoras")}
							</Typography>
							<Typography level="body-sm">
								{t("common:pages.settings.stableDiffusionLorasDescription")}
							</Typography>
						</ListItemContent>
						<ListItemDecorator sx={{ width: 288, flexShrink: 0 }}>
							<FolderField
								fullWidth
								aria-label={t("common:loras")}
								value={sdSettings.loras}
								onChange={event => {
									setSdSettings(previousValue => ({
										...previousValue,
										loras: event.target.value,
									}));
								}}
								onSelect={async value => {
									await window.ipc.fetch(STABLE_DIFFUSION_SETTINGS, {
										method: "PATCH",
										data: { loras: value },
									});
									setSdSettings(previousValue => ({
										...previousValue,
										loras: value,
									}));
								}}
								onBlur={event => {
									window.ipc.fetch(STABLE_DIFFUSION_SETTINGS, {
										method: "PATCH",
										data: { loras: event.target.value },
									});
								}}
							/>
						</ListItemDecorator>
					</ListItem>
				</List>
			</CardContent>
		</Card>
	);
}

export function RunPodSettings() {
	const { t } = useTranslation(["common"]);
	return (
		<Card variant="soft">
			<Typography>{t("common:pages.settings.runPodSettings")}</Typography>
			<CardContent>
				<List>
					<ListItem>
						<ListItemContent>
							<Typography level="title-sm">{t("common:comingSoon")}</Typography>
						</ListItemContent>
					</ListItem>
				</List>
			</CardContent>
		</Card>
	);
}

export default function Page(_properties: InferGetStaticPropsType<typeof getStaticProps>) {
	const { t } = useTranslation(["common"]);
	return (
		<>
			<Head>
				<title>{`Captain | ${t("common:settings")}`}</title>
			</Head>
			<Box
				sx={{
					position: "absolute",
					inset: 0,
					display: "flex",
					flexDirection: "column",
					overflow: "hidden",
				}}
			>
				<Sheet
					sx={{
						position: "sticky",
						top: 0,
						display: "flex",
						alignItems: "center",
						height: 44,
						px: 2,
						zIndex: 1,
					}}
				>
					<Typography level="h4" component="h1">
						{t("common:settings")}
					</Typography>
					<Box sx={{ flex: 1 }} />
				</Sheet>
				<Box sx={{ flex: 1, position: "relative" }}>
					<CustomScrollbars>
						<Container sx={{ py: 2 }}>
							<Stack spacing={4}>
								<UserPreferences />
								<OpenAISettings />
								<RunPodSettings />
								<StableDiffusionSettings />
							</Stack>
						</Container>
					</CustomScrollbars>
				</Box>
			</Box>
		</>
	);
}

export const getStaticProps = makeStaticProperties(["common"]);

export { getStaticPaths } from "@/ions/i18n/get-static";
