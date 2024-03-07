import Input from "@mui/joy/Input";
import Sheet from "@mui/joy/Sheet";
import type { InferGetStaticPropsType } from "next";
import Head from "next/head";
import { useTranslation } from "next-i18next";

import { Logo } from "@/atoms/logo";
import { makeStaticProperties } from "@/ions/i18n/get-static";

export default function Page(_properties: InferGetStaticPropsType<typeof getStaticProps>) {
	const { t } = useTranslation(["common", "labels"]);

	return (
		<>
			<Head>
				<title>{t("labels:dashboard")}</title>
			</Head>
			<Sheet variant="soft" color="primary" sx={{ p: 2, display: "flex", gap: 2 }}>
				<Input startDecorator={<Logo />} sx={{ flex: 1 }} />
			</Sheet>
		</>
	);
}

export const getStaticProps = makeStaticProperties(["common", "texts", "labels"]);

export { getStaticPaths } from "@/ions/i18n/get-static";
