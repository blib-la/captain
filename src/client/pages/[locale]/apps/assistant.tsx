import { AppFrame } from "@captn/joy/app-frame";
import { TitleBar } from "@captn/joy/title-bar";
import AssistantIcon from "@mui/icons-material/Assistant";
import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import type { InferGetStaticPropsType } from "next";
import Head from "next/head";
import { useTranslation } from "next-i18next";

import { Assistant } from "@/client/apps/assistant";
import { makeStaticProperties } from "@/client/ions/i18n/get-static";

export default function Page(_properties: InferGetStaticPropsType<typeof getStaticProps>) {
	const { t } = useTranslation(["common", "labels"]);
	const color = "lime";

	return (
		<AppFrame
			titleBar={
				<TitleBar color={color} variant="solid">
					<Typography level="title-md" component="h1" startDecorator={<AssistantIcon />}>
						{t("labels:assistant")}
					</Typography>
				</TitleBar>
			}
		>
			<Head>
				<title>{t("labels:assistant")}</title>
			</Head>
			<Box sx={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column" }}>
				<Assistant color={color} />
			</Box>
		</AppFrame>
	);
}

export const getStaticProps = makeStaticProperties(["common", "texts", "labels"]);

export { getStaticPaths } from "@/client/ions/i18n/get-static";
