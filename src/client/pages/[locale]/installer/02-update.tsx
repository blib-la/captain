import { AppFrame } from "@captn/joy/app-frame";
import { TitleBar } from "@captn/joy/title-bar";
import { DownloadState } from "@captn/utils/constants";
import OpenInNew from "@mui/icons-material/OpenInNew";
import Alert from "@mui/joy/Alert";
import Box from "@mui/joy/Box";
import Button from "@mui/joy/Button";
import LinearProgress from "@mui/joy/LinearProgress";
import Typography from "@mui/joy/Typography";
import type { InferGetStaticPropsType } from "next";
import { useTranslation } from "next-i18next";
import { useState } from "react";

import { buildKey } from "#/build-key";
import { ID } from "#/enums";
import { useInstallProgress } from "@/ions/hooks/install-progress";
import { makeStaticProperties } from "@/ions/i18n/get-static";
import { InstallStep } from "@/organisms/installer";
import { QuoteLoop } from "@/organisms/quote-loop";

export function InstallScreen({
	percent,
	status,
	name,
	size,
	error,
}: {
	percent: number;
	status: DownloadState;
	name: string;
	size: string;
	error: string;
}) {
	const { t } = useTranslation(["labels", "texts"]);

	switch (status) {
		case DownloadState.UPDATE: {
			return (
				<InstallStep
					heading={t("labels:installUpdate")}
					illustration="/illustrations/minimalistic/search.svg"
				>
					<Typography level="body-lg" sx={{ my: 2, textAlign: "center" }}>
						{t("texts:updateIntro")}
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

					<Typography sx={{ mb: 1 }}>
						{name} ({size})
					</Typography>

					<LinearProgress
						determinate
						color="primary"
						value={percent * 100}
						sx={{
							mb: 4,
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
					<Box
						sx={{
							flex: 1,
							position: "relative",
							display: "flex",
							alignItems: "center",
						}}
					>
						<Typography level="body-lg" sx={{ my: 2, textAlign: "center" }}>
							{t("texts:downloadSuccessUnpacking")}
						</Typography>
					</Box>
					<LinearProgress
						color="primary"
						sx={{
							mb: 4,
							flexGrow: 0,
							"--LinearProgress-radius": "0px",
							"--LinearProgress-thickness": "48px",
						}}
					/>
				</InstallStep>
			);
		}

		case DownloadState.DONE: {
			return (
				<InstallStep
					heading={t("labels:installationSuccess")}
					illustration="/illustrations/minimalistic/discovery.svg"
				>
					<Box
						sx={{
							flex: 1,
							position: "relative",
							display: "flex",
							alignItems: "center",
						}}
					>
						<Typography level="body-lg" sx={{ my: 2, textAlign: "center" }}>
							{t("texts:unpackingSuccess")}
						</Typography>
					</Box>
				</InstallStep>
			);
		}

		case DownloadState.FAILED: {
			return (
				<InstallStep
					heading={t("labels:updateFailed")}
					illustration="/illustrations/minimalistic/bankruptcy.svg"
				>
					<Box
						sx={{
							flex: 1,
							position: "relative",
							display: "flex",
							justifyContent: "center",
							flexDirection: "column",
						}}
					>
						<Alert color="danger" sx={{ my: 2 }}>
							<Typography level="body-lg">{error}</Typography>
						</Alert>

						<Typography level="body-lg" sx={{ my: 2, textAlign: "center" }}>
							{t("texts:tryAgainOrReport")}
						</Typography>
					</Box>
				</InstallStep>
			);
		}

		default: {
			return null;
		}
	}
}

export default function Page(_properties: InferGetStaticPropsType<typeof getStaticProps>) {
	const { t } = useTranslation(["labels", "installer"]);
	const { progress, status, name, size, error, reset } = useInstallProgress({
		state: DownloadState.UPDATE,
	});
	const [starting, setStarting] = useState(false);

	return (
		<AppFrame titleBar={<TitleBar disableMaximize />}>
			<Box sx={{ minHeight: "100%", display: "flex", flexDirection: "column" }}>
				<InstallScreen
					percent={progress.percent}
					status={status}
					name={name}
					size={size}
					error={error}
				/>
				<Box sx={{ display: "flex", justifyContent: "flex-end", m: 1 }}>
					<Box sx={{ display: "flex", gap: 1 }}>
						{status === DownloadState.FAILED && (
							<Button
								data-testid="installer-02-report-problem"
								component="a"
								color="danger"
								href="https://github.com/blib-la/captain/issues"
								target="_blank"
								startDecorator={<OpenInNew />}
							>
								{t("labels:reportProblem")}
							</Button>
						)}

						{status === DownloadState.DONE ? (
							<Button
								disabled={starting}
								data-testid="installer-02-ready"
								onClick={() => {
									setStarting(true);
									window.ipc.send(buildKey([ID.APP], { suffix: ":ready" }), true);
								}}
							>
								{t("labels:finish")}
							</Button>
						) : (
							<Button
								data-testid="installer-02-start"
								disabled={
									status !== DownloadState.UPDATE &&
									status !== DownloadState.FAILED
								}
								onClick={() => {
									reset();
									window.ipc.send(buildKey([ID.INSTALL], { suffix: ":start" }));
								}}
							>
								{t("labels:update")}
							</Button>
						)}
					</Box>
				</Box>
			</Box>
		</AppFrame>
	);
}

export const getStaticProps = makeStaticProperties(["installer", "texts", "labels"]);

export { getStaticPaths } from "@/ions/i18n/get-static";
