import { AppFrame } from "@captn/joy/app-frame";
import { TitleBar } from "@captn/joy/title-bar";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import type { InferGetStaticPropsType } from "next";
import Head from "next/head";
import { useTranslation } from "next-i18next";

import { Story } from "@/apps/story";
import { makeStaticProperties } from "@/ions/i18n/get-static";
export default function Page(_properties: InferGetStaticPropsType<typeof getStaticProps>) {
	const { t } = useTranslation(["common", "labels"]);

	return (
		<AppFrame
			titleBar={
				<TitleBar color="yellow" variant="solid">
					<Typography level="title-md" component="h1" startDecorator={<MenuBookIcon />}>
						{t("labels:createStory")}
					</Typography>
				</TitleBar>
			}
		>
			<Head>
				<title>{t("labels:createStory")}</title>
			</Head>
			<Box sx={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column" }}>
				<Story />
			</Box>
		</AppFrame>
	);
}

export const getStaticProps = makeStaticProperties(["common", "texts", "labels"]);

export { getStaticPaths } from "@/ions/i18n/get-static";
