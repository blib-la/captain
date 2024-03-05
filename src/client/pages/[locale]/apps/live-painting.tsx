import { AppFrame } from "@captn/joy/app-frame";
import { TitleBar } from "@captn/joy/title-bar";
import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import type { InferGetStaticPropsType } from "next";
import Head from "next/head";
import { useTranslation } from "next-i18next";

import { makeStaticProperties } from "@/ions/i18n/get-static";

export default function Page(_properties: InferGetStaticPropsType<typeof getStaticProps>) {
	const { t } = useTranslation(["common", "labels"]);

	return (
		<AppFrame
			color="violet"
			variant="solid"
			titleBar={
				<TitleBar>
					<Typography level="title-md" component="h1">
						{t("labels:livePainting")}
					</Typography>
				</TitleBar>
			}
		>
			<Head>
				<title>{`Captain | ${t("labels:livePainting")}`}</title>
			</Head>

			<Box sx={{ px: 1, py: 2 }}>
				<Typography>{t("labels:livePainting")}</Typography>
			</Box>
		</AppFrame>
	);
}

export const getStaticProps = makeStaticProperties(["common", "texts", "labels"]);

export { getStaticPaths } from "@/ions/i18n/get-static";
