import { CustomScrollbars } from "@captn/joy/custom-scrollbars";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import UpdateIcon from "@mui/icons-material/Update";
import Button from "@mui/joy/Button";
import Card from "@mui/joy/Card";
import CardContent from "@mui/joy/CardContent";
import CircularProgress from "@mui/joy/CircularProgress";
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

import { makeStaticProperties } from "@/client/ions/i18n/get-static";
import { ColorModeSelector } from "@/client/organisms/color-mode-selector";
import { LanguageSelect } from "@/client/organisms/language-select";
import { PasswordField } from "@/client/organisms/password-field";
import { buildKey } from "@/shared/build-key";
import { ID } from "@/shared/enums";
import package_ from "~package";

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

export function AutoUpdate() {
	const { t } = useTranslation(["labels", "texts"]);
	const [available, setAvailable] = useState(false);
	const [downloaded, setDownloaded] = useState(false);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		const unsubscribeAvailable = window.ipc.on(
			buildKey([ID.UPDATE], { suffix: ":available" }),
			() => {
				setLoading(false);
				setAvailable(true);
			}
		);

		const unsubscribeNotAvailable = window.ipc.on(
			buildKey([ID.UPDATE], { suffix: ":not-available" }),
			() => {
				setLoading(false);
			}
		);

		const unsubscribeDownloaded = window.ipc.on(
			buildKey([ID.UPDATE], { suffix: ":downloaded" }),
			() => {
				setLoading(false);
				setDownloaded(true);
			}
		);

		return () => {
			unsubscribeNotAvailable();
			unsubscribeAvailable();
			unsubscribeDownloaded();
		};
	}, []);

	return (
		<Card variant="soft">
			<Typography>{t("labels:update")}</Typography>
			<CardContent>
				<List>
					<ListItem>
						<ListItemContent>
							<Typography level="title-sm">{t("labels:checkForUpdates")}</Typography>
							<Typography level="body-sm">
								{t("texts:keepCaptainUpToDate")}
							</Typography>
						</ListItemContent>
						<ListItemDecorator sx={{ width: 200, flexShrink: 0 }}>
							{available && !downloaded && (
								<Button
									fullWidth
									disabled={loading}
									startDecorator={loading ? <CircularProgress /> : <UpdateIcon />}
									sx={{ whiteSpace: "nowrap" }}
									onClick={() => {
										setLoading(true);
										window.ipc.send(
											buildKey([ID.UPDATE], { suffix: ":download" }),
											true
										);
									}}
								>
									{t("labels:updateNow")}
								</Button>
							)}

							{downloaded && (
								<Button
									fullWidth
									startDecorator={<RestartAltIcon />}
									sx={{ whiteSpace: "nowrap" }}
									onClick={() => {
										window.ipc.send(
											buildKey([ID.UPDATE], { suffix: ":install" }),
											true
										);
									}}
								>
									{t("labels:installAndRestart")}
								</Button>
							)}

							{!available && !downloaded && (
								<Button
									fullWidth
									disabled={loading}
									startDecorator={loading ? <CircularProgress /> : <UpdateIcon />}
									sx={{ whiteSpace: "nowrap" }}
									onClick={() => {
										setLoading(true);
										window.ipc.send(
											buildKey([ID.UPDATE], { suffix: ":check" }),
											true
										);
									}}
								>
									{t("labels:checkForUpdates")}
								</Button>
							)}
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
				<Container sx={{ py: 2, pb: 8 }}>
					<Stack spacing={4}>
						<UserPreferences />
						<OpenAISettings />
						<AutoUpdate />
					</Stack>
					<Sheet
						variant="soft"
						sx={{
							position: "fixed",
							zIndex: 2,
							bottom: 0,
							left: 0,
							right: 0,
							px: 2,
							py: 1,
						}}
					>
						v{package_.version}
					</Sheet>
				</Container>
			</CustomScrollbars>
		</>
	);
}

export const getStaticProps = makeStaticProperties(["common", "labels", "texts"]);

export { getStaticPaths } from "@/client/ions/i18n/get-static";
