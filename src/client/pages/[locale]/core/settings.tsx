import { CustomScrollbars } from "@captn/joy/custom-scrollbars";
import Card from "@mui/joy/Card";
import CardContent from "@mui/joy/CardContent";
import Container from "@mui/joy/Container";
import List from "@mui/joy/List";
import ListItem from "@mui/joy/ListItem";
import ListItemContent from "@mui/joy/ListItemContent";
import ListItemDecorator from "@mui/joy/ListItemDecorator";
import Stack from "@mui/joy/Stack";
import Typography from "@mui/joy/Typography";
import type { InferGetStaticPropsType } from "next";
import Head from "next/head";
import { useTranslation } from "next-i18next";
import { useEffect, useState } from "react";

import { buildKey } from "#/build-key";
import { ID } from "#/enums";
import { makeStaticProperties } from "@/ions/i18n/get-static";
import { ColorModeSelector } from "@/organisms/color-mode-selector";
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

	useEffect(() => {
		window.ipc.send(buildKey([ID.KEYS], { suffix: ":get-openAiApiKey" }));
		const unsubscribe = window.ipc.on(
			buildKey([ID.KEYS], { suffix: ":openAiApiKey" }),
			(openAiApiKey_: string) => {
				setOpenAiApiKey(openAiApiKey_);
			}
		);
		return () => {
			unsubscribe();
		};
	}, []);

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
								slotProps={{
									input: {
										"data-captainid": "openai-api-key",
									},
								}}
								onBlur={event => {
									window.ipc.send(
										buildKey([ID.KEYS], { suffix: ":set-openAiApiKey" }),
										event.target.value
									);
								}}
								onChange={event => {
									setOpenAiApiKey(event.target.value);
								}}
							/>
						</ListItemDecorator>
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
				<title>{t("common:settings")}</title>
			</Head>
			<CustomScrollbars>
				<Container sx={{ py: 2 }}>
					<Stack spacing={4}>
						<UserPreferences />
						<OpenAISettings />
					</Stack>
				</Container>
			</CustomScrollbars>
		</>
	);
}

export const getStaticProps = makeStaticProperties(["common", "labels"]);

export { getStaticPaths } from "@/ions/i18n/get-static";
