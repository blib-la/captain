import Box from "@mui/joy/Box";
import Button from "@mui/joy/Button";
import LinearProgress from "@mui/joy/LinearProgress";
import Typography from "@mui/joy/Typography";
import type { Progress } from "electron-dl";
import type { InferGetStaticPropsType } from "next";
import { useTranslation } from "next-i18next";
import { useCallback, useEffect, useState } from "react";

import { buildKey } from "#/build-key";
import { DownloadState, ID } from "#/enums";
import { I18nLink } from "@/atoms/i18n-link";
import { makeStaticProperties } from "@/ions/i18n/get-static";
import { Illustration } from "@/organisms/illustration";

function useInstallProgress() {
	const [status, setStatus] = useState(DownloadState.IDLE);
	const [progress, setProgress] = useState<Progress>({
		percent: 0,
		transferredBytes: 0,
		totalBytes: 0,
	});
	const reset = useCallback(() => {
		setProgress({
			percent: 0,
			transferredBytes: 0,
			totalBytes: 0,
		});
	}, []);

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
	return { status, progress, reset };
}

export function InstallScreen({ percent, status }: { percent: number; status: DownloadState }) {
	const { t } = useTranslation(["installer"]);
	return (
		<>
			<Illustration
				height={200}
				path={
					status === DownloadState.IDLE
						? "/illustrations/minimalistic/success.svg"
						: "/illustrations/minimalistic/meditation.svg"
				}
			/>
			<Typography level="h1" sx={{ my: 2, textAlign: "center" }}>
				{t("installer:install")}
			</Typography>
			<Box sx={{ flex: 1, display: "flex", alignItems: "center" }}>
				{status === DownloadState.IDLE ? (
					<Typography level="body-lg" sx={{ my: 2, textAlign: "center" }}>
						{t("installer:installerIntro")}
					</Typography>
				) : (
					<LinearProgress
						determinate
						color="primary"
						value={percent * 100}
						sx={{
							"--LinearProgress-radius": "0px",
							"--LinearProgress-thickness": "96px",
						}}
					/>
				)}
			</Box>
		</>
	);
}

export default function Page(_properties: InferGetStaticPropsType<typeof getStaticProps>) {
	const { t } = useTranslation(["common"]);
	const { progress, status, reset } = useInstallProgress();

	return (
		<>
			<InstallScreen percent={progress.percent} status={status} />
			<Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
				<Box sx={{ display: "flex", gap: 1 }}>
					<I18nLink href="/installer/01">
						<Button component="a" disabled={status !== DownloadState.IDLE}>
							{t("common:previous")}
						</Button>
					</I18nLink>
					<Button
						disabled={status !== DownloadState.IDLE}
						onClick={() => {
							reset();

							window.ipc.send(buildKey([ID.INSTALL], { suffix: "start" }));
						}}
					>
						{t("installer:install")}
					</Button>
				</Box>
			</Box>
		</>
	);
}

export const getStaticProps = makeStaticProperties(["common", "installer"]);

export { getStaticPaths } from "@/ions/i18n/get-static";
