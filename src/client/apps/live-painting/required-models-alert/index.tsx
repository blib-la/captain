import WarningIcon from "@mui/icons-material/Warning";
import Box from "@mui/joy/Box";
import Button from "@mui/joy/Button";
import LinearProgress from "@mui/joy/LinearProgress";
import Snackbar from "@mui/joy/Snackbar";
import Typography from "@mui/joy/Typography";
import { useTranslation } from "next-i18next";
import { useEffect, useState } from "react";

export interface DownloadTask {
	label: string;
	id: string;
	source: string;
	destination: string;
	appId?: string;
	unzip?: boolean;
}

export const allRequiredDownloads: DownloadTask[] = [
	{
		label: "SD Turbo",
		id: "stabilityai/sd-turbo/fp16",
		source: "https://pub-aea7c308ba0147b69deba50a606e7743.r2.dev/stabilityai-sd-turbo-fp16.7z",
		destination: "stable-diffusion/checkpoints",
		unzip: true,
	},
	{
		label: "Taesd",
		id: "madebyollin/taesd",
		source: "https://pub-aea7c308ba0147b69deba50a606e7743.r2.dev/taesd.7z",
		destination: "stable-diffusion/vae",
		unzip: true,
	},
];

export function RequiredModelsAlert({ inline, appId }: { inline?: boolean; appId: string }) {
	const { t } = useTranslation(["common", "labels"]);
	const [downloadCount, setDownloadCount] = useState(0);
	const [percent, setPercent] = useState(0);
	const [isDownloading, setIsDownloading] = useState(false);
	const [requiredDownloads, setRequiredDownloads] = useState<DownloadTask[]>([]);
	const [isCompleted, setIsCompleted] = useState(downloadCount >= requiredDownloads.length);

	useEffect(() => {
		const unsubscribeDownload = window.ipc.on("download", progress => {
			setPercent(progress.percent);
		});
		const unsubscribeDownloadComplete = window.ipc.on("downloadComplete", () => {
			setDownloadCount(previousState => previousState + 1);
		});
		return () => {
			unsubscribeDownload();
			unsubscribeDownloadComplete();
		};
	}, []);

	useEffect(() => {
		if (downloadCount >= requiredDownloads.length) {
			setIsCompleted(true);
			setIsDownloading(false);
		} else {
			setIsCompleted(false);
		}
	}, [downloadCount, requiredDownloads]);

	useEffect(() => {
		for (const requiredDownload of allRequiredDownloads) {
			const keyPath = requiredDownload.destination.replaceAll("/", ".");
			window.ipc.inventoryStore
				.get<
					{
						id: string;
						modelPath: string;
						label: string;
					}[]
				>(keyPath)
				.then(value => {
					if (!value || !value.some(({ id }) => id === requiredDownload.id)) {
						setRequiredDownloads(previousState => [...previousState, requiredDownload]);
					}
				});
		}
	}, []);

	return (
		<Snackbar
			open={!isCompleted}
			variant="soft"
			color="warning"
			startDecorator={<WarningIcon />}
			sx={{
				position: inline ? "relative" : "fixed",
				bottom: inline ? "auto" : "var(--Snackbar-inset)",
				right: inline ? "auto" : "var(--Snackbar-inset)",
			}}
			slotProps={{
				endDecorator: {
					sx: { alignSelf: "flex-end" },
				},
				startDecorator: {
					sx: { alignSelf: "flex-start", mt: 0.25 },
				},
			}}
			endDecorator={
				<Button
					disabled={isDownloading}
					size="sm"
					variant="solid"
					color="warning"
					onClick={async () => {
						setIsDownloading(true);
						await window.ipc.downloadFiles(
							requiredDownloads.map(requiredDownload => ({
								...requiredDownload,
								appId,
							}))
						);
					}}
				>
					{t("labels:download")}
				</Button>
			}
		>
			<Box>
				<Typography level="title-lg" component="h2" sx={{ mb: 2 }}>
					Essential Model Downloads Needed!
				</Typography>
				<Typography>
					To activate the full power of our live-painting app, please download the missing
					files.
				</Typography>

				<Typography sx={{ mt: 1 }}>Click &quot;Download&quot; to start!</Typography>
				<Typography sx={{ mt: 1 }}>
					Downloaded {downloadCount} of {requiredDownloads.length}
				</Typography>
				<LinearProgress
					determinate
					variant="solid"
					color="warning"
					value={percent * 100}
					sx={{
						position: "absolute",
						bottom: 0,
						left: 0,
						right: 0,
						borderRadius: 0,
					}}
				/>
			</Box>
		</Snackbar>
	);
}
