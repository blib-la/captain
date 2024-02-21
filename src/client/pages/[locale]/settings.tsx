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

import { makeStaticProperties } from "@/ions/i18n/get-static";
import { ColorModeSelector } from "@/organisms/color-mode-selector";
import { CustomScrollbars } from "@/organisms/custom-scrollbars";
import { LanguageSelect } from "@/organisms/language-select";

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
								{/* <OpenAISettings />
								<RunPodSettings />
								<StableDiffusionSettings /> */}
							</Stack>
						</Container>
					</CustomScrollbars>
				</Box>
			</Box>
		</>
	);
}

export const getStaticProps = makeStaticProperties(["common", "labels"]);

export { getStaticPaths } from "@/ions/i18n/get-static";
