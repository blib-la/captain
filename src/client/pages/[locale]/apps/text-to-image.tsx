import { AppFrame } from "@captn/joy/app-frame";
import { TitleBar } from "@captn/joy/title-bar";
import CollectionsIcon from "@mui/icons-material/Collections";
import Typography from "@mui/joy/Typography";
import type { InferGetStaticPropsType } from "next";
import Head from "next/head";
import { useTranslation } from "next-i18next";

import { TextToImage } from "@/client/apps/text-to-image";
import { makeStaticProperties } from "@/client/ions/i18n/get-static";

export default function Page(_properties: InferGetStaticPropsType<typeof getStaticProps>) {
	const { t } = useTranslation(["common", "labels"]);

	return (
		<AppFrame
			titleBar={
				<TitleBar color="orange" variant="solid">
					<Typography
						level="title-md"
						component="h1"
						startDecorator={<CollectionsIcon />}
					>
						{t("labels:textToImage")}
					</Typography>
				</TitleBar>
			}
		>
			<Head>
				<title>{t("labels:textToImage")}</title>
			</Head>

			<TextToImage />
		</AppFrame>
	);
}

export const getStaticProps = makeStaticProperties(["common", "texts", "labels"]);

export { getStaticPaths } from "@/client/ions/i18n/get-static";
