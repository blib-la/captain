import { AppFrame } from "@captn/joy/app-frame";
import { TitleBar } from "@captn/joy/title-bar";
import Box from "@mui/joy/Box";
import Button from "@mui/joy/Button";
import CircularProgress from "@mui/joy/CircularProgress";
import Input from "@mui/joy/Input";
import Typography from "@mui/joy/Typography";
import type { InferGetStaticPropsType } from "next";
import { useTranslation } from "next-i18next";
import { useState } from "react";

import { buildKey } from "#/build-key";
import { ID } from "#/enums";
import { Captain } from "@/atoms/logo/captain";
import { makeStaticProperties } from "@/ions/i18n/get-static";

function DummyPrompt() {
	const { t } = useTranslation(["labels", "texts"]);
	return (
		<Box
			sx={{
				position: "relative",
				fontSize: 24,
				my: "1em",
				mx: 1,
				overflow: "hidden",
				boxShadow: "md",
			}}
		>
			<Input
				readOnly
				placeholder={t("labels:placeholder.prompt")}
				endDecorator={
					<Box
						sx={{
							flex: 1,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							height: 44,
							width: 44,
						}}
					>
						<Captain sx={{ height: "100%" }} />
					</Box>
				}
				sx={{
					fontSize: "inherit",
					lineHeight: 1.25,
					p: 2,
					flexDirection: "row",
				}}
			/>
		</Box>
	);
}

export default function Page(_properties: InferGetStaticPropsType<typeof getStaticProps>) {
	const { t } = useTranslation(["labels", "texts"]);
	const [starting, setStarting] = useState(false);

	const buttonText = starting ? t("labels:starting") : t("labels:start");

	return (
		<AppFrame titleBar={<TitleBar disableMaximize />}>
			<Box sx={{ minHeight: "100%", display: "flex", flexDirection: "column" }}>
				<Box sx={{ height: 200, alignContent: "center", px: 2 }}>
					<DummyPrompt />
				</Box>

				<Typography level="h1" sx={{ my: 2, textAlign: "center" }}>
					{t("labels:finishing")}
				</Typography>

				<Box
					sx={{
						flex: 1,
						display: "flex",
						flexDirection: "column",
						justifyContent: "center",
						mx: 8,
					}}
				>
					<Box
						sx={{
							display: "flex",
							p: 2,
							backgroundColor: "background.default",
							borderRadius: "8px",
							flexDirection: "column",
						}}
					>
						<Typography level="body-lg" sx={{ my: 2, textAlign: "center" }}>
							{t("texts:howToUseCaptain")}
						</Typography>
					</Box>
				</Box>

				<Box sx={{ display: "flex", justifyContent: "flex-end", m: 1 }}>
					<Box sx={{ display: "flex", gap: 1 }}>
						<Button
							endDecorator={starting ? <CircularProgress size="sm" /> : null}
							onClick={() => {
								setStarting(true);
								window.ipc.send(buildKey([ID.APP], { suffix: ":ready" }), true);
							}}
						>
							{buttonText}
						</Button>
					</Box>
				</Box>
			</Box>
		</AppFrame>
	);
}

export const getStaticProps = makeStaticProperties(["common", "installer", "texts", "labels"]);

export { getStaticPaths } from "@/ions/i18n/get-static";
