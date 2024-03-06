import { AppFrame } from "@captn/joy/app-frame";
import { TitleBar } from "@captn/joy/title-bar";
import Box from "@mui/joy/Box";
import Button from "@mui/joy/Button";
import Typography from "@mui/joy/Typography";
import type { InferGetStaticPropsType } from "next";
import { useTranslation } from "next-i18next";

import { I18nLink } from "@/atoms/i18n-link";
import { useSsrColorScheme } from "@/ions/hooks/color-scheme";
import { makeStaticProperties } from "@/ions/i18n/get-static";
import { Illustration } from "@/organisms/illustration";

export function ColorScreen() {
	const { t } = useTranslation(["installer"]);
	const { mode, setMode } = useSsrColorScheme();
	return (
		<>
			<Illustration path="/illustrations/minimalistic/website-design.svg" height={200} />
			<Typography level="h1" sx={{ my: 2, textAlign: "center" }}>
				{t("common:colorMode.label")}
			</Typography>
			<Box
				sx={{
					flex: 1,
					display: "flex",
					alignItems: "center",
					gap: 2,
					mx: 8,
				}}
			>
				<Button
					variant={mode === "light" ? "solid" : "plain"}
					color="primary"
					sx={{
						flex: 1,
						aspectRatio: 1,
						flexDirection: "column",
					}}
					onClick={() => {
						setMode("light");
					}}
				>
					<Box
						sx={theme => ({
							height: 96,
							width: 96,
							bgcolor: "neutral.100",
							mb: 2,
							border: `1px solid ${theme.palette.neutral[500]}`,
						})}
					/>
					{t("common:colorMode.light")}
				</Button>
				<Button
					variant={mode === "dark" ? "solid" : "plain"}
					color="primary"
					sx={{
						flex: 1,
						aspectRatio: 1,
						flexDirection: "column",
					}}
					onClick={() => {
						setMode("dark");
					}}
				>
					<Box
						sx={theme => ({
							height: 96,
							width: 96,
							bgcolor: "neutral.900",
							mb: 2,
							border: `1px solid ${theme.palette.neutral[500]}`,
						})}
					/>
					{t("common:colorMode.dark")}
				</Button>
				<Button
					variant={mode === "system" ? "solid" : "plain"}
					color="primary"
					sx={{
						flex: 1,
						aspectRatio: 1,
						flexDirection: "column",
					}}
					onClick={() => {
						setMode("system");
					}}
				>
					<Box
						sx={theme => ({
							height: 96,
							width: 96,
							display: "flex",
							mb: 2,
							border: `1px solid ${theme.palette.neutral[500]}`,
						})}
					>
						<Box sx={{ height: "100%", width: "50%", bgcolor: "neutral.100" }} />
						<Box sx={{ height: "100%", width: "50%", bgcolor: "neutral.900" }} />
					</Box>
					{t("common:colorMode.system")}
				</Button>
			</Box>
		</>
	);
}

export default function Page(_properties: InferGetStaticPropsType<typeof getStaticProps>) {
	const { t } = useTranslation(["common"]);

	return (
		<AppFrame titleBar={<TitleBar disableMaximize />}>
			<Box sx={{ minHeight: "100%", display: "flex", flexDirection: "column" }}>
				<ColorScreen />
				<Box sx={{ display: "flex", justifyContent: "flex-end", m: 1 }}>
					<Box sx={{ display: "flex", gap: 1 }}>
						<I18nLink href="/installer/00">
							<Button component="a">{t("common:previous")}</Button>
						</I18nLink>
						<I18nLink href="/installer/02">
							<Button component="a">{t("common:next")}</Button>
						</I18nLink>
					</Box>
				</Box>
			</Box>
		</AppFrame>
	);
}

export const getStaticProps = makeStaticProperties(["common", "installer"]);

export { getStaticPaths } from "@/ions/i18n/get-static";
