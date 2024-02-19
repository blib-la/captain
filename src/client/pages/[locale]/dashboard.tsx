import Typography from "@mui/joy/Typography";
import type { InferGetStaticPropsType } from "next";
import { useTranslation } from "next-i18next";

import { makeStaticProperties } from "@/ions/i18n/get-static";

export default function Page(_properties: InferGetStaticPropsType<typeof getStaticProps>) {
	const { t } = useTranslation(["common"]);
	return (
		<>
			<Typography>{t("common:dashboard")}</Typography>
		</>
	);
}

export const getStaticProps = makeStaticProperties(["common"]);

export { getStaticPaths } from "@/ions/i18n/get-static";
