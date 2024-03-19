import WarningIcon from "@mui/icons-material/Warning";
import Box from "@mui/joy/Box";
import Button from "@mui/joy/Button";
import LinearProgress from "@mui/joy/LinearProgress";
import Snackbar from "@mui/joy/Snackbar";
import Typography from "@mui/joy/Typography";
import { getProperty } from "dot-prop";
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

export function useRequiredModels() {
	const [isCompleted, setIsCompleted] = useState(false);

	useEffect(() => {
		const unsubscribeAllInventory = window.ipc.on(
			"allInventory",
			(inventory: Record<string, unknown>) => {
				const done = allRequiredDownloads.every(item => {
					const keyPath = item.destination.replaceAll("/", ".");
					const inventoryCollection = getProperty<
						Record<string, unknown>,
						string,
						{
							id: string;
						}[]
					>(inventory, keyPath);
					if (Array.isArray(inventoryCollection)) {
						return inventoryCollection.some(
							inventoryItem => inventoryItem.id === item.id
						);
					}

					return false;
				});
				setIsCompleted(done);
			}
		);

		return () => {
			unsubscribeAllInventory();
		};
	}, []);

	useEffect(() => {
		Promise.all(
			allRequiredDownloads.map(async requiredDownload => {
				const keyPath = requiredDownload.destination.replaceAll("/", ".");
				const value = await window.ipc.inventoryStore.get<
					{
						id: string;
						modelPath: string;
						label: string;
					}[]
				>(keyPath);
				return value?.some(({ id }) => id === requiredDownload.id);
			})
		).then(results => {
			setIsCompleted(results.every(Boolean));
		});
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
					if (value?.some(({ id }) => id === requiredDownload.id)) {
						console.log(requiredDownload.id);
					}
				});
		}
	}, []);

	return isCompleted;
}

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
		const unsubscribeAllDownloads = window.ipc.on("allDownloads", downloads => {
			const activities = requiredDownloads
				.map(downloadItem => ({
					id: downloadItem.id,
					state: downloads[downloadItem.id],
				}))
				.filter(activity => Boolean(activity.state));
			if (activities.length > 0) {
				setIsDownloading(true);
			}
		});
		return () => {
			unsubscribeAllDownloads();
		};
	}, [requiredDownloads]);

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

	const isCompleted_ = useRequiredModels();

	return (
		<Snackbar
			open={!isCompleted && !isCompleted_}
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
					{t("texts:essentialModelDownloads")}
				</Typography>
				<Typography>{t("texts:activateFullPower")}</Typography>

				<Typography sx={{ mt: 1 }}>{t("labels:clickDownloadToStart")}</Typography>
				<Typography sx={{ mt: 1 }}>
					{t("labels:downloadedOf", {
						downloaded: downloadCount,
						downloads: requiredDownloads.length,
					})}
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
