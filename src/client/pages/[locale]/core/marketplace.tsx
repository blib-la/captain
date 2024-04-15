import { useRequiredDownloads } from "@captn/react/use-required-downloads";
import type { RequiredDownload } from "@captn/utils/types";
import CheckCircle from "@mui/icons-material/CheckCircle";
import WarningIcon from "@mui/icons-material/Warning";
import Alert from "@mui/joy/Alert";
import Box from "@mui/joy/Box";
import Button from "@mui/joy/Button";
import Card from "@mui/joy/Card";
import CardContent from "@mui/joy/CardContent";
import CardOverflow from "@mui/joy/CardOverflow";
import CircularProgress from "@mui/joy/CircularProgress";
import Typography from "@mui/joy/Typography";
import type { InferGetStaticPropsType } from "next";
import Head from "next/head";
import { useTranslation } from "next-i18next";
import React, { useEffect, useState } from "react";

import { buildKey } from "#/build-key";
import { ID } from "#/enums";
import { makeStaticProperties } from "@/ions/i18n/get-static";

// ToDo: Replace with actual URL
const marketplaceUrl =
	"https://github.com/blib-la/captain-marketplace/releases/download/1.0.0-alpha.3/index.json";

interface MarketplaceItem {
	id: string;
	payload: MarketplaceItemPayload;
}

interface MarketplaceItemPayload {
	type: string;
	description: string;
	author: string;
	thumbnail: string;
	download: RequiredDownload;
	link?: string;
	license?: string;
	architecture?: string;
}

function fetchMarketplace() {
	window.ipc.send(buildKey([ID.MARKETPLACE], { suffix: ":download" }), {
		marketplaceUrl,
	});
}

/**
 * A hook to determine if we are connected to a network.
 */
function useOnlineStatus() {
	const [isOnline, setIsOnline] = useState(
		typeof navigator === "undefined" ? false : navigator.onLine
	);

	useEffect(() => {
		function setOnline() {
			setIsOnline(true);
		}

		function setOffline() {
			setIsOnline(false);
		}

		window.addEventListener("online", setOnline);
		window.addEventListener("offline", setOffline);

		return () => {
			window.removeEventListener("online", setOnline);
			window.removeEventListener("offline", setOffline);
		};
	}, []);

	return isOnline;
}

/**
 * An item in the Marketplace.
 *
 * @param payload - The content for one Item in the Marketplace
 */
function ItemCard({ payload }: { payload: MarketplaceItemPayload }) {
	const { t } = useTranslation(["labels"]);
	const { download, isCompleted, isDownloading } = useRequiredDownloads([payload.download]);

	let buttonText;
	let startDecorator;

	// Control the state of the download button
	if (isCompleted) {
		buttonText = t("labels:downloaded");
		startDecorator = <CheckCircle />;
	} else if (isDownloading) {
		buttonText = t("labels:downloading");
		startDecorator = <CircularProgress size="sm" />;
	} else {
		buttonText = t("labels:download");
		startDecorator = null;
	}

	return (
		<Card>
			{payload.thumbnail && (
				<CardOverflow>
					<img
						src={payload.thumbnail}
						alt={`${payload.download.label} thumbnail`}
						loading="lazy"
					/>
				</CardOverflow>
			)}
			<CardContent>
				<Typography level="h2">{payload.download.label}</Typography>
				<Typography level="body-md">{payload.description}</Typography>
				<Typography level="body-sm">{payload.author}</Typography>
				<Button startDecorator={startDecorator} disabled={isCompleted} onClick={download}>
					{buttonText}
				</Button>
			</CardContent>
		</Card>
	);
}

/**
 * Show an alert for every error that happens and provide a way for the user to retry.
 *
 * @param error - The error message
 */
function ErrorMessage({ error }: { error: string }) {
	const { t } = useTranslation(["labels"]);

	return (
		<Alert
			color="warning"
			variant="soft"
			startDecorator={<WarningIcon />}
			slotProps={{ startDecorator: { sx: { alignSelf: "flexStart" } } }}
		>
			<Typography>{error}</Typography>
			<Button
				onClick={() => {
					fetchMarketplace();
				}}
			>
				{t("lables:retry")}
			</Button>
		</Alert>
	);
}

export default function Page(_properties: InferGetStaticPropsType<typeof getStaticProps>) {
	const { t } = useTranslation(["common", "labels"]);

	const [items, setItems] = useState<MarketplaceItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const connected = useOnlineStatus();

	const notConnected = t("texts:notConnectedToTheInternet");

	useEffect(() => {
		// Receive marketplace data
		const unsubscribeData = window.ipc.on(
			buildKey([ID.MARKETPLACE], { suffix: ":data" }),
			data => {
				setItems(data.items);
				setLoading(false);

				if (connected) {
					setError("");
				}
			}
		);

		// Error for marketplace data
		const unsubscribeError = window.ipc.on(
			buildKey([ID.MARKETPLACE], { suffix: ":error" }),
			error => {
				setError(error);
				setLoading(false);
			}
		);

		// Download the latest marketplace data
		if (connected) {
			fetchMarketplace();
		} else {
			// Download the cached marketplace data
			window.ipc.send(buildKey([ID.MARKETPLACE], { suffix: ":cached" }));

			setError(notConnected);
			setLoading(false);
		}

		return () => {
			unsubscribeError();
			unsubscribeData();
		};
	}, [connected, notConnected]);

	return (
		<>
			<Head>
				<title>{t("labels:marketplace")}</title>
			</Head>

			{loading && (
				<Box>
					<CircularProgress />
				</Box>
			)}

			{!loading && error && (
				<Box>
					<ErrorMessage error={error} />
				</Box>
			)}

			{!loading && (!error || !connected) && (
				<Box>
					<Button
						onClick={() => {
							fetchMarketplace();
						}}
					>
						{t("labels:marketplaceRefresh")}
					</Button>

					<Box
						sx={{
							display: "grid",
							gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
						}}
					>
						{items.map(item => (
							<ItemCard key={item.id} payload={item.payload} />
						))}
					</Box>
				</Box>
			)}
		</>
	);
}

export const getStaticProps = makeStaticProperties(["common", "texts", "labels"]);

export { getStaticPaths } from "@/ions/i18n/get-static";
