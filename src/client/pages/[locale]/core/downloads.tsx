import { CustomScrollbars } from "@captn/joy/custom-scrollbars";
import type { DownloadItem } from "@captn/utils/constants";
import { DownloadEvent, DOWNLOADS_MESSAGE_KEY, DownloadState } from "@captn/utils/constants";
import BuildCircleIcon from "@mui/icons-material/BuildCircle";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DownloadingIcon from "@mui/icons-material/Downloading";
import ErrorIcon from "@mui/icons-material/Error";
import PauseCircleIcon from "@mui/icons-material/PauseCircle";
import PendingIcon from "@mui/icons-material/Pending";
import Box from "@mui/joy/Box";
import LinearProgress from "@mui/joy/LinearProgress";
import List from "@mui/joy/List";
import ListItem from "@mui/joy/ListItem";
import ListItemContent from "@mui/joy/ListItemContent";
import ListItemDecorator from "@mui/joy/ListItemDecorator";
import Sheet, { sheetClasses } from "@mui/joy/Sheet";
import type { ColorPaletteProp } from "@mui/joy/styles";
import type { InferGetStaticPropsType } from "next";
import Head from "next/head";
import { useTranslation } from "next-i18next";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import { makeStaticProperties } from "@/ions/i18n/get-static";

export interface DownloadListItemProperties {
	id: string;
	percent: number;
	label: string;
	state: DownloadState;
	createdAt: number;
}

const iconMap: Record<DownloadState, ReactNode> = {
	[DownloadState.ACTIVE]: <DownloadingIcon />,
	[DownloadState.IDLE]: <PendingIcon />,
	[DownloadState.DONE]: <CheckCircleIcon />,
	[DownloadState.FAILED]: <ErrorIcon />,
	[DownloadState.CANCELED]: <PauseCircleIcon />,
	[DownloadState.UNPACKING]: <BuildCircleIcon />,
} as const;
const iconColors: Record<DownloadState, ColorPaletteProp> = {
	[DownloadState.ACTIVE]: "green",
	[DownloadState.IDLE]: "neutral",
	[DownloadState.DONE]: "neutral",
	[DownloadState.FAILED]: "red",
	[DownloadState.CANCELED]: "neutral",
	[DownloadState.UNPACKING]: "green",
} as const;

export function DownloadListItem({ label, percent, state }: DownloadListItemProperties) {
	return (
		<ListItem variant="outlined" sx={{ py: 3 }}>
			<ListItemDecorator>
				<Sheet variant="solid" color={iconColors[state]}>
					{iconMap[state]}
				</Sheet>
			</ListItemDecorator>
			<ListItemContent>{label}</ListItemContent>
			<Box
				sx={{
					position: "absolute",
					right: 0,
					left: 0,
					bottom: 0,
				}}
			>
				<LinearProgress
					determinate={state !== DownloadState.UNPACKING}
					value={state === DownloadState.UNPACKING ? undefined : percent}
					color={iconColors[state]}
					variant="soft"
					sx={{
						"--LinearProgress-progressRadius": "0px",
						"--LinearProgress-radius": "0px",
					}}
				/>
			</Box>
		</ListItem>
	);
}

export default function Page(_properties: InferGetStaticPropsType<typeof getStaticProps>) {
	const { t } = useTranslation(["common", "labels"]);
	const [downloads, setDownloads] = useState<DownloadListItemProperties[]>([]);

	useEffect(() => {
		function addOrUpdateDownload(item: DownloadListItemProperties) {
			setDownloads(previousState => {
				const itemExists = previousState.some(download => download.id === item.id);
				if (itemExists) {
					return previousState.map(download =>
						download.id === item.id ? item : download
					);
				}

				return [item, ...previousState].sort((a, b) => b.createdAt - a.createdAt);
			});
		}

		const unsubscribeDownloads = window.ipc.on(DOWNLOADS_MESSAGE_KEY, message => {
			switch (message.action) {
				case "getAll": {
					setDownloads(
						message.payload.map(
							(
								download: DownloadItem & {
									percent?: number;
									transferredBytes?: number;
									totalBytes?: number;
								}
							) => ({
								createdAt: download.createdAt,
								id: download.id,
								label: download.label,
								percent: download.percent ?? 0,
								state: download.state,
							})
						)
					);
					break;
				}

				case DownloadEvent.QUEUED: {
					addOrUpdateDownload({
						createdAt: message.payload.createdAt,
						id: message.payload.id,
						label: message.payload.label,
						percent: 0,
						state: DownloadState.IDLE,
					});
					break;
				}

				case DownloadEvent.STARTED: {
					addOrUpdateDownload({
						createdAt: message.payload.createdAt,
						id: message.payload.id,
						label: message.payload.label,
						percent: 0,
						state: DownloadState.ACTIVE,
					});
					break;
				}

				case DownloadEvent.COMPLETED: {
					addOrUpdateDownload({
						createdAt: message.payload.createdAt,
						id: message.payload.id,
						label: message.payload.label,
						percent: 1,
						state: DownloadState.DONE,
					});
					break;
				}

				case DownloadEvent.ERROR: {
					addOrUpdateDownload({
						createdAt: message.payload.createdAt,
						id: message.payload.id,
						label: message.payload.label,
						percent: 0,
						state: DownloadState.FAILED,
					});
					break;
				}

				case DownloadEvent.CANCELED: {
					addOrUpdateDownload({
						createdAt: message.payload.createdAt,
						id: message.payload.id,
						label: message.payload.label,
						percent: 0,
						state: DownloadState.CANCELED,
					});
					break;
				}

				case DownloadEvent.UNPACKING: {
					addOrUpdateDownload({
						createdAt: message.payload.createdAt,
						id: message.payload.id,
						label: message.payload.label,
						percent: 1,
						state: DownloadState.UNPACKING,
					});
					break;
				}

				case DownloadEvent.PROGRESS: {
					addOrUpdateDownload({
						createdAt: message.payload.createdAt,
						id: message.payload.id,
						label: message.payload.label,
						percent: message.payload.percent,
						state: DownloadState.ACTIVE,
					});
					break;
				}

				default: {
					break;
				}
			}
		});

		window.ipc.send(DOWNLOADS_MESSAGE_KEY, { action: "getAll" });

		return () => {
			unsubscribeDownloads();
		};
	}, []);
	return (
		<>
			<Head>
				<title>{t("labels:downloads")}</title>
			</Head>
			<CustomScrollbars>
				<Box sx={{ p: 2 }}>
					<List
						sx={{
							"--List-gap": "8px",
							[`& .${sheetClasses.root}`]: {
								p: 0.5,
								lineHeight: 0,
							},
						}}
					>
						{downloads.map(download => (
							<DownloadListItem
								key={download.id}
								id={download.id}
								createdAt={download.createdAt}
								percent={download.percent * 100}
								label={download.label}
								state={download.state}
							/>
						))}
					</List>
				</Box>
			</CustomScrollbars>
		</>
	);
}

export const getStaticProps = makeStaticProperties(["common", "labels"]);

export { getStaticPaths } from "@/ions/i18n/get-static";
