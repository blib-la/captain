import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import Box from "@mui/joy/Box";
import IconButton from "@mui/joy/IconButton";
import Sheet from "@mui/joy/Sheet";
import Stack from "@mui/joy/Stack";
import Tooltip from "@mui/joy/Tooltip";
import Typography from "@mui/joy/Typography";
import type { InferGetStaticPropsType } from "next";
import Head from "next/head";
import { useTranslation } from "next-i18next";
import { useEffect, useState } from "react";

import { buildKey } from "#/build-key";
import { ID } from "#/enums";
import { makeStaticProperties } from "@/ions/i18n/get-static";
import { CustomScrollbars } from "@/organisms/custom-scrollbars";
import { LivePainting } from "@/organisms/live-painting";

export default function Page(_properties: InferGetStaticPropsType<typeof getStaticProps>) {
	const { t } = useTranslation(["common", "labels"]);
	const [running, setRunning] = useState(false);

	useEffect(() => {
		const unsubscribeStarted = window.ipc.on(
			buildKey([ID.LIVE_PAINT], { suffix: ":started" }),
			() => {
				setRunning(true);
			}
		);

		const unsubscribeStopped = window.ipc.on(
			buildKey([ID.LIVE_PAINT], { suffix: ":stopped" }),
			() => {
				setRunning(false);
			}
		);

		return () => {
			unsubscribeStarted();
			unsubscribeStopped();
		};
	}, []);

	useEffect(() => {
		window.ipc.send(buildKey([ID.LIVE_PAINT], { suffix: ":start" }));
		return () => {
			window.ipc.send(buildKey([ID.LIVE_PAINT], { suffix: ":stop" }));
		};
	}, []);

	return (
		<>
			<Head>
				<title>{`Captain | ${t("labels:livePainting")}`}</title>
			</Head>

			<Stack sx={{ position: "absolute", inset: 0, overflow: "hidden" }}>
				<Sheet
					sx={{
						position: "sticky",
						top: 0,
						display: "flex",
						alignItems: "center",
						height: 44,
						px: 1,
						zIndex: 1,
					}}
				>
					<Typography level="h4" component="h1">
						{t("labels:livePainting")}
					</Typography>
					<Box sx={{ flex: 1 }} />
					<Box sx={{ display: "flex", gap: 1 }}>
						<Tooltip title={running ? t("labels:stop") : t("labels:start")}>
							<IconButton
								size="lg"
								color="primary"
								variant="solid"
								data-testid="live-painting-start"
								aria-label={running ? t("labels:stop") : t("labels:start")}
								onClick={() => {
									if (running) {
										window.ipc.send(
											buildKey([ID.LIVE_PAINT], { suffix: ":stop" })
										);
									} else {
										window.ipc.send(
											buildKey([ID.LIVE_PAINT], { suffix: ":start" })
										);
									}
								}}
							>
								{running ? <StopIcon /> : <PlayArrowIcon />}
							</IconButton>
						</Tooltip>
					</Box>
				</Sheet>
				<Box
					sx={{
						flex: 1,
						position: "relative",
					}}
				>
					<CustomScrollbars>
						<LivePainting running={running} />
					</CustomScrollbars>
				</Box>
			</Stack>
		</>
	);
}

export const getStaticProps = makeStaticProperties(["common", "texts", "labels"]);

export { getStaticPaths } from "@/ions/i18n/get-static";
