import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Box from "@mui/joy/Box";
import IconButton from "@mui/joy/IconButton";
import Typography from "@mui/joy/Typography";
import type { InferGetStaticPropsType } from "next";
import { useTranslation } from "next-i18next";

import { I18nLink } from "@/atoms/i18n-link";
import { makeStaticProperties } from "@/ions/i18n/get-static";
import { CustomScrollbars } from "@/organisms/custom-scrollbars";
import { Illustration } from "@/organisms/illustration";
import { LanguageSelectList } from "@/organisms/language-select";

export function LanguageSettings() {
	const { t } = useTranslation(["common", "installer"]);
	return (
		<>
			<Illustration path="/illustrations/minimalistic/international.svg" height={200} />
			<Typography level="h1" sx={{ my: 2, textAlign: "center" }}>
				{t("common:language")}
			</Typography>
			<Box
				sx={{
					flex: 1,
					position: "relative",
				}}
			>
				<Box sx={{ position: "absolute", inset: 0 }}>
					<CustomScrollbars>
						<LanguageSelectList />
					</CustomScrollbars>
				</Box>
			</Box>
		</>
	);
}

export default function Page(_properties: InferGetStaticPropsType<typeof getStaticProps>) {
	const { t } = useTranslation(["common"]);

	return (
		<>
			<LanguageSettings />
			<Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
				<Box sx={{ display: "flex", gap: 1 }}>
					<I18nLink href="/installer/01">
						<IconButton component="a" aria-label={t("common:next")}>
							<ArrowForwardIcon />
						</IconButton>
					</I18nLink>
				</Box>
			</Box>
		</>
	);
}

export const getStaticProps = makeStaticProperties(["common", "installer"]);

export { getStaticPaths } from "@/ions/i18n/get-static";
