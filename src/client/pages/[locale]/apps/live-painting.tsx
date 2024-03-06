import { AppFrame } from "@captn/joy/app-frame";
import { TitleBar } from "@captn/joy/title-bar";
import { useSDK } from "@captn/react/use-sdk";
import Box from "@mui/joy/Box";
import Button from "@mui/joy/Button";
import Sheet from "@mui/joy/Sheet";
import Typography from "@mui/joy/Typography";
import type { InferGetStaticPropsType } from "next";
import Head from "next/head";
import { useTranslation } from "next-i18next";
import { useState } from "react";

import { LivePainting } from "@/apps/live-painting";
import { APP_ID } from "@/apps/live-painting/constants";
import { makeStaticProperties } from "@/ions/i18n/get-static";

export default function Page(_properties: InferGetStaticPropsType<typeof getStaticProps>) {
	const { t } = useTranslation(["common", "labels"]);
	const [running, setRunning] = useState(false);

	const { send } = useSDK(APP_ID, {
		onMessage(message) {
			console.log(message);
			switch (message.action) {
				case "livePainting:started": {
					setRunning(true);
					break;
				}

				case "livePainting:stopped": {
					setRunning(false);
					break;
				}

				default: {
					break;
				}
			}
		},
	});

	return (
		<AppFrame
			color="violet"
			variant="solid"
			titleBar={
				<TitleBar>
					<Typography level="title-md" component="h1">
						{t("labels:livePainting")}
					</Typography>
				</TitleBar>
			}
		>
			<Head>
				<title>{`Captain | ${t("labels:livePainting")}`}</title>
			</Head>

			<Box sx={{ display: "flex", flexDirection: "column", minHeight: "100%" }}>
				<Sheet>
					<Button
						onClick={() => {
							send({ action: "livePainting:start", payload: APP_ID });
						}}
					>
						Start
					</Button>
				</Sheet>
				<Box sx={{ position: "relative", flex: 1, flexShrink: 0 }}>
					<LivePainting running={running} />
				</Box>
			</Box>
		</AppFrame>
	);
}

export const getStaticProps = makeStaticProperties(["common", "texts", "labels"]);

export { getStaticPaths } from "@/ions/i18n/get-static";
