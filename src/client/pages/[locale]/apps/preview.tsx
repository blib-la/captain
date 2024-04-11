import { AppFrame } from "@captn/joy/app-frame";
import { TitleBar } from "@captn/joy/title-bar";
import PreviewIcon from "@mui/icons-material/Preview";
import Typography from "@mui/joy/Typography";
import type { InferGetStaticPropsType } from "next";
import Head from "next/head";
import { useTranslation } from "next-i18next";

import { Preview } from "@/apps/preview";
import { makeStaticProperties } from "@/ions/i18n/get-static";

export default function Page(_properties: InferGetStaticPropsType<typeof getStaticProps>) {
	const { t } = useTranslation(["common", "labels"]);

	return (
		<AppFrame
			titleBar={
				<TitleBar color="violet" variant="solid">
					<Typography level="title-md" component="h1" startDecorator={<PreviewIcon />}>
						{t("labels:preview")}
					</Typography>
				</TitleBar>
			}
		>
			<Head>
				<title>{t("labels:preview")}</title>
			</Head>
			<Preview />
		</AppFrame>
	);
}

export const getStaticProps = makeStaticProperties(["common", "texts", "labels"]);

export { getStaticPaths } from "@/ions/i18n/get-static";
