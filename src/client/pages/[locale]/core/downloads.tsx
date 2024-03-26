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
import { useState } from "react";

import { DownloadState } from "#/enums";
import { makeStaticProperties } from "@/ions/i18n/get-static";

export interface DownloadItem {
	id: string;
	percent: number;
	label: string;
	state: DownloadState;
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

export function DownloadListItem({ label, percent, state }: DownloadItem) {
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
	const [downloads, setDownloads] = useState<DownloadItem[]>([
		{
			percent: 0.3,
			id: "1",
			label: "Active Download Example",
			state: DownloadState.ACTIVE,
		},
		{
			percent: 0,
			id: "2",
			label: "Pending Download Example",
			state: DownloadState.IDLE,
		},
		{
			percent: 0,
			id: "3",
			label: "Failed Download Example",
			state: DownloadState.FAILED,
		},
		{
			percent: 0.4,
			id: "4",
			label: "Canceled Download Example",
			state: DownloadState.CANCELED,
		},
		{
			percent: 1,
			id: "5",
			label: "Completed Download Example",
			state: DownloadState.DONE,
		},
		{
			percent: 1,
			id: "6",
			label: "Unpacking Download Example",
			state: DownloadState.UNPACKING,
		},
	]);

	return (
		<>
			<Head>
				<title>{t("labels:downloads")}</title>
			</Head>
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
							percent={download.percent * 100}
							label={download.label}
							state={download.state}
						/>
					))}
				</List>
			</Box>
		</>
	);
}

export const getStaticProps = makeStaticProperties(["common", "labels"]);

export { getStaticPaths } from "@/ions/i18n/get-static";
