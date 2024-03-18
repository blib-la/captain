import Box from "@mui/joy/Box";
import type { InferGetStaticPropsType } from "next";
import Head from "next/head";
import { useTranslation } from "next-i18next";

import { RequiredModelsAlert } from "@/apps/live-painting/required-models-alert";
import { makeStaticProperties } from "@/ions/i18n/get-static";

export default function Page(_properties: InferGetStaticPropsType<typeof getStaticProps>) {
	const { t } = useTranslation(["common", "labels"]);

	return (
		<>
			<Head>
				<title>{t("labels:dashboard")}</title>
			</Head>
			<Box sx={{ p: 2 }}>
				<RequiredModelsAlert inline appId="core" />
			</Box>
		</>
	);
}

export const getStaticProps = makeStaticProperties(["common", "texts", "labels"]);

export { getStaticPaths } from "@/ions/i18n/get-static";
