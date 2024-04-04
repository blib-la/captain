import { AppFrame } from "@captn/joy/app-frame";
import { CustomScrollbars } from "@captn/joy/custom-scrollbars";
import { TitleBar } from "@captn/joy/title-bar";
import BrushIcon from "@mui/icons-material/Brush";
import Typography from "@mui/joy/Typography";
import type { InferGetStaticPropsType } from "next";
import Head from "next/head";
import { useTranslation } from "next-i18next";

import { LivePainting } from "@/apps/live-painting";
import { makeStaticProperties } from "@/ions/i18n/get-static";

export default function Page(_properties: InferGetStaticPropsType<typeof getStaticProps>) {
	const { t } = useTranslation(["common", "labels"]);

	return (
		<AppFrame
			titleBar={
				<TitleBar color="orange" variant="solid">
					<Typography level="title-md" component="h1" startDecorator={<BrushIcon />}>
						{t("labels:livePainting")}
					</Typography>
				</TitleBar>
			}
		>
			<Head>
				<title>{t("labels:livePainting")}</title>
			</Head>
			<CustomScrollbars>
				<LivePainting />
			</CustomScrollbars>
		</AppFrame>
	);
}

export const getStaticProps = makeStaticProperties(["common", "texts", "labels"]);

export { getStaticPaths } from "@/ions/i18n/get-static";
