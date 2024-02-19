import Box from "@mui/joy/Box";
import Button from "@mui/joy/Button";
import LinearProgress from "@mui/joy/LinearProgress";
import Sheet from "@mui/joy/Sheet";
import Typography from "@mui/joy/Typography";
import type { Progress } from "electron-dl";
import type { InferGetStaticPropsType } from "next";
import { useTranslation } from "next-i18next";
import { useEffect, useState } from "react";

import { buildKey } from "#/build-key";
import { DownloadState, ID } from "#/enums";
import { makeStaticProperties } from "@/ions/i18n/get-static";
import { LanguageSelect } from "@/organisms/language-select";
import { TitleBar } from "@/organisms/title-bar";

export default function Page(_properties: InferGetStaticPropsType<typeof getStaticProps>) {
	const { t } = useTranslation(["installer"]);
	const [status, setStatus] = useState(DownloadState.IDLE);
	const [progress, setProgress] = useState<Progress>({
		percent: 0,
		transferredBytes: 0,
		totalBytes: 0,
	});

	useEffect(() => {
		const unsubscribeStarted = window.ipc.on(
			buildKey([ID.INSTALL], { suffix: ":started" }),
			() => {
				setStatus(DownloadState.ACTIVE);
			}
		);
		const unsubscribeProgress = window.ipc.on(
			buildKey([ID.INSTALL], { suffix: ":progress" }),
			(progress: Progress) => {
				setStatus(DownloadState.ACTIVE);
				setProgress(progress);
			}
		);
		const unsubscribeCancelled = window.ipc.on(
			buildKey([ID.INSTALL], { suffix: ":cancelled" }),
			() => {
				setStatus(DownloadState.CANCELLED);
			}
		);
		const unsubscribeCompleted = window.ipc.on(
			buildKey([ID.INSTALL], { suffix: ":completed" }),
			() => {
				setStatus(DownloadState.DONE);
				window.ipc.send(buildKey([ID.APP], { suffix: ":ready" }), true);
			}
		);

		return () => {
			unsubscribeStarted();
			unsubscribeProgress();
			unsubscribeCancelled();
			unsubscribeCompleted();
		};
	}, []);

	return (
		<Box
			sx={{
				height: "100dvh",
				overflow: "hidden",
				display: "grid",
				gridTemplateColumns: "1fr",
				gridTemplateRows: "36px 1fr",
			}}
		>
			<TitleBar disableMaximize />
			<Sheet
				variant="plain"
				sx={{
					position: "relative",
					overflow: "hidden",
					p: 2,
					display: "flex",
					flexDirection: "column",
				}}
			>
				<Box
					sx={{
						flex: 1,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<Box>
						<Typography sx={{ my: 2 }}>{t("installer:installerIntro")}</Typography>
						<LanguageSelect />
					</Box>
				</Box>
				<Button
					fullWidth
					disabled={status !== DownloadState.IDLE}
					onClick={() => {
						setProgress({
							percent: 0,
							transferredBytes: 0,
							totalBytes: 0,
						});

						window.ipc.send(buildKey([ID.INSTALL], { suffix: "start" }));
					}}
				>
					<LinearProgress
						determinate
						value={progress.percent * 100}
						sx={{
							position: "absolute",
							inset: 0,
							"--LinearProgress-radius": "0px",
							"--LinearProgress-thickness": "100%",
						}}
					/>
					{progress.percent === 0 && (
						<Box sx={{ position: "relative" }}>{t("installer:install")}</Box>
					)}
				</Button>
			</Sheet>
		</Box>
	);
}

export const getStaticProps = makeStaticProperties(["common", "installer"]);

export { getStaticPaths } from "@/ions/i18n/get-static";
