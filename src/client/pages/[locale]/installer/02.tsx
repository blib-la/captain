import Box from "@mui/joy/Box";
import Button from "@mui/joy/Button";
import LinearProgress from "@mui/joy/LinearProgress";
import Typography from "@mui/joy/Typography";
import type { Progress } from "electron-dl";
import type { InferGetStaticPropsType } from "next";
import { useTranslation } from "next-i18next";
import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";

import { buildKey } from "#/build-key";
import { DownloadState, ID } from "#/enums";
import { I18nLink } from "@/atoms/i18n-link";
import { makeStaticProperties } from "@/ions/i18n/get-static";
import { Illustration } from "@/organisms/illustration";
import { QuoteLoop } from "@/organisms/quote-loop";

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
		const unsubscribeUnpacking = window.ipc.on(
			buildKey([ID.INSTALL], { suffix: ":unpacking" }),
			() => {
				setStatus(DownloadState.UNPACKING);
			}
		);

		return () => {
			unsubscribeStarted();
			unsubscribeProgress();
			unsubscribeCancelled();
			unsubscribeCompleted();
			unsubscribeUnpacking();
		};
	}, []);
	return { status, progress, reset };
}

function InstallStep({
	illustration,
	heading,
	children,
}: {
	illustration: string;
	heading: string;
	children?: ReactNode;
}) {
	return (
		<>
			<Illustration height={200} path={illustration} />
			<Typography level="h1" sx={{ my: 2, textAlign: "center" }}>
				{heading}
			</Typography>
			<Box
				sx={{
					flex: 1,
					display: "flex",
					flexDirection: "column",
					justifyContent: "center",
				}}
			>
				{children}
			</Box>
		</>
	);
}

export function InstallScreen({ percent, status }: { percent: number; status: DownloadState }) {
	const { t } = useTranslation(["installer", "labels", "texts"]);

	switch (status) {
		case DownloadState.IDLE: {
			return (
				<InstallStep
					heading={t("installer:install")}
					illustration="/illustrations/minimalistic/meditation.svg"
				>
					<Typography level="body-lg" sx={{ my: 2, textAlign: "center" }}>
						{t("installer:installerIntro")}
					</Typography>
				</InstallStep>
			);
		}

		case DownloadState.ACTIVE: {
			return (
				<InstallStep
					heading={t("labels:downloading")}
					illustration="/illustrations/minimalistic/cloud-computing.svg"
				>
					<Box sx={{ flex: 1, position: "relative" }}>
						<QuoteLoop />
					</Box>
					<LinearProgress
						determinate
						color="primary"
						value={percent * 100}
						sx={{
							flexGrow: 0,
							"--LinearProgress-radius": "0px",
							"--LinearProgress-thickness": "48px",
						}}
					/>
				</InstallStep>
			);
		}

		case DownloadState.UNPACKING: {
			return (
				<InstallStep
					heading={t("labels:unpacking")}
					illustration="/illustrations/minimalistic/discovery.svg"
				>
					<Typography level="body-lg" sx={{ my: 2, textAlign: "center" }}>
						{t("texts:downloadSuccessUnpacking")}
					</Typography>
				</InstallStep>
			);
		}

		default: {
			return null;
		}
	}
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
						data-testid="installer-02-start"
						onClick={() => {
							reset();

							window.ipc.send(buildKey([ID.INSTALL], { suffix: ":start" }), [
								{
									url: "https://blibla-captain-assets.s3.eu-central-1.amazonaws.com/python-embedded-win.7z",
									destination: "python-embedded",
								},
								{
									url: "https://blibla-captain-assets.s3.eu-central-1.amazonaws.com/portable-git-win.7z",
									destination: "portable-git",
								},
							]);
						}}
					>
						{t("installer:install")}
					</Button>
				</Box>
			</Box>
		</>
	);
}

export const getStaticProps = makeStaticProperties(["common", "installer", "texts", "labels"]);

export { getStaticPaths } from "@/ions/i18n/get-static";
