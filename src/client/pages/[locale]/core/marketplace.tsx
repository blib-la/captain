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
import useSWR from "swr";

import { buildKey } from "#/build-key";
import { ID } from "#/enums";
import { makeStaticProperties } from "@/ions/i18n/get-static";

const marketplaceUrl = "https://blib-la.github.io/captain-marketplace/captain.json";

interface MarketplaceItem {
	id: string;
	payload: MarketplaceItemPayload;
}

interface MarketplaceItemPayload {
	type: string;
	label: string;
	description: string;
	author: string;
	images: Record<string, string>;
	sources: RequiredDownload[];
	link?: string;
	license?: string;
	architecture?: string;
}

/**
 * Fetch data for the marketplace. When we are connected to the internet, we fetch the live data.
 * When we are not connected, we use the cached data.
 *
 * @param connected boolean - Internet connection status
 * @param marketplaceUrl string - URL pointing to the marketplace data
 *
 * @returns Promise
 */
function fetchMarketplace(connected: boolean, marketplaceUrl: string): Promise<any> {
	return new Promise((resolve, reject) => {
		const unsubscribeData = window.ipc.on(
			buildKey([ID.MARKETPLACE], { suffix: ":data" }),
			data => {
				resolve(data);
				unsubscribeData();
				unsubscribeError();
			}
		);
		const unsubscribeError = window.ipc.on(
			buildKey([ID.MARKETPLACE], { suffix: ":error" }),
			error => {
				reject(error);
				unsubscribeData();
				unsubscribeError();
			}
		);

		window.ipc.send(buildKey([ID.MARKETPLACE], { suffix: ":fetch" }), {
			marketplaceUrl,
			download: connected,
		});
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

	const { download, isCompleted, isDownloading } = useRequiredDownloads(payload.sources);

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
			{payload.images.thumbnail && (
				<CardOverflow>
					<img
						src={payload.images.thumbnail}
						alt={`${payload.label} thumbnail`}
						loading="lazy"
					/>
				</CardOverflow>
			)}
			<CardContent>
				<Typography level="h2">{payload.label}</Typography>
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
	return (
		<Alert
			color="warning"
			variant="soft"
			startDecorator={<WarningIcon />}
			slotProps={{ startDecorator: { sx: { alignSelf: "flexStart" } } }}
		>
			<Typography>{error}</Typography>
		</Alert>
	);
}

export default function Page(_properties: InferGetStaticPropsType<typeof getStaticProps>) {
	const { t } = useTranslation(["common", "labels"]);

	const connected = useOnlineStatus();

	const { data, error, isLoading, mutate } = useSWR(
		["marketplaceData", connected],
		() => fetchMarketplace(connected, marketplaceUrl),
		{
			shouldRetryOnError: false,
			revalidateOnFocus: true,
		}
	);

	const errorMessage = connected ? error ?? null : t("texts:notConnectedToTheInternet");

	return (
		<>
			<Head>
				<title>{t("labels:marketplace")}</title>
			</Head>

			{/* Loading the data for the marketplace */}
			{isLoading && (
				<Box>
					<CircularProgress />
				</Box>
			)}

			{/* Some kind of error occurred */}
			{!isLoading && errorMessage && (
				<Box>
					<ErrorMessage error={errorMessage} />
				</Box>
			)}

			{/* Everything was loaded, so we show the marketplace items */}
			{!isLoading && !errorMessage && data && (
				<Box>
					<Button disabled={!connected} onClick={() => mutate()}>
						{t("labels:marketplaceRefresh")}
					</Button>

					<Box
						sx={{
							display: "grid",
							gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
						}}
					>
						{data.map((item: MarketplaceItem) => (
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
