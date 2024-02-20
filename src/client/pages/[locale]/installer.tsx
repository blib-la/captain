import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Box from "@mui/joy/Box";
import Button from "@mui/joy/Button";
import IconButton from "@mui/joy/IconButton";
import LinearProgress from "@mui/joy/LinearProgress";
import Sheet from "@mui/joy/Sheet";
import Typography from "@mui/joy/Typography";
import type { Progress } from "electron-dl";
import type { InferGetStaticPropsType } from "next";
import { useTranslation } from "next-i18next";
import { useCallback, useEffect, useState } from "react";

import { buildKey } from "#/build-key";
import { DownloadState, ID } from "#/enums";
import { useSsrColorScheme } from "@/ions/hooks/color-scheme";
import { makeStaticProperties } from "@/ions/i18n/get-static";
import { CustomScrollbars } from "@/organisms/custom-scrollbars";
import { Illustration } from "@/organisms/illustration";
import { LanguageSelectList } from "@/organisms/language-select";
import { TitleBar } from "@/organisms/title-bar";

function useSteps({ initialStep = 0, max = Number.POSITIVE_INFINITY, min = 0 } = {}) {
	const [step, setStep] = useState(initialStep);
	const goTo = useCallback((nextStep: number) => {
		setStep(nextStep);
	}, []);
	const goToNext = useCallback(() => {
		setStep(previousStep => Math.min(max, previousStep + 1));
	}, [max]);
	const goToPrevious = useCallback(() => {
		setStep(previousStep => Math.max(min, previousStep - 1));
	}, [min]);

	return { step, goTo, goToNext, goToPrevious };
}

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

export function LanguageSettings() {
	const { t } = useTranslation(["common", "installer"]);
	return (
		<>
			<Illustration path="/illustrations/minimalistic/public-speaker.svg" height={200} />
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

export function ColorScreen() {
	const { t } = useTranslation(["installer"]);
	const { mode, setMode } = useSsrColorScheme();
	return (
		<>
			<Illustration path="/illustrations/minimalistic/website-design.svg" height={200} />
			<Typography level="h1" sx={{ my: 2, textAlign: "center" }}>
				{t("common:colorMode.label")}
			</Typography>
			<Box sx={{ flex: 1, display: "flex", alignItems: "center" }}>
				<Box sx={{ width: "100%", display: "flex", gap: 4 }}>
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
								width: 128,
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
								width: 128,
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
								width: 128,
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
			</Box>
		</>
	);
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

export function Steps({
	step,
	percent,
	status,
}: {
	step: number;
	percent: number;
	status: DownloadState;
}) {
	switch (step) {
		case 0: {
			return <LanguageSettings />;
		}

		case 1: {
			return <ColorScreen />;
		}

		case 2: {
			return <InstallScreen percent={percent} status={status} />;
		}

		default: {
			return null;
		}
	}
}

const steps = 2;

export default function Page(_properties: InferGetStaticPropsType<typeof getStaticProps>) {
	const { t } = useTranslation(["common"]);
	const { step, goToNext, goToPrevious } = useSteps({ max: steps });
	const { progress, status, reset } = useInstallProgress();

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
				<Steps step={step} percent={progress.percent} status={status} />
				<Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
					<Box sx={{ display: "flex", gap: 1 }}>
						{step === 0 && (
							<IconButton aria-label={t("common:next")} onClick={goToNext}>
								<ArrowForwardIcon />
							</IconButton>
						)}
						{step > 0 && (
							<Button disabled={status !== DownloadState.IDLE} onClick={goToPrevious}>
								{t("common:previous")}
							</Button>
						)}
						{step > 0 && step < steps && (
							<Button onClick={goToNext}>{t("common:next")}</Button>
						)}
						{step === steps && (
							<Button
								disabled={status !== DownloadState.IDLE}
								onClick={() => {
									reset();

									window.ipc.send(buildKey([ID.INSTALL], { suffix: "start" }));
								}}
							>
								{t("installer:install")}
							</Button>
						)}
					</Box>
				</Box>
			</Sheet>
		</Box>
	);
}

export const getStaticProps = makeStaticProperties(["common", "installer"]);

export { getStaticPaths } from "@/ions/i18n/get-static";
