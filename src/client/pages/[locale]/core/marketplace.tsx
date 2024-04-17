import { CustomScrollbars } from "@captn/joy/custom-scrollbars";
import { useRequiredDownloads } from "@captn/react/use-required-downloads";
import CheckCircle from "@mui/icons-material/CheckCircle";
import RefreshIcon from "@mui/icons-material/Refresh";
import WarningIcon from "@mui/icons-material/Warning";
import Alert from "@mui/joy/Alert";
import Box from "@mui/joy/Box";
import Button from "@mui/joy/Button";
import Card from "@mui/joy/Card";
import CardContent from "@mui/joy/CardContent";
import CardOverflow from "@mui/joy/CardOverflow";
import CircularProgress from "@mui/joy/CircularProgress";
import Sheet from "@mui/joy/Sheet";
import Typography from "@mui/joy/Typography";
import type { InferGetStaticPropsType } from "next";
import Head from "next/head";
import { useTranslation } from "next-i18next";
import React from "react";
import useSWR from "swr";

import type {
	Marketplace,
	Payload as MarketplacePayload,
	Entry as MarketplaceEntry,
} from "#/types/marketplace";
import { useOnlineStatus } from "@/ions/hooks/online-status";
import { makeStaticProperties } from "@/ions/i18n/get-static";

const marketplaceUrl = "https://blib-la.github.io/captain-marketplace/captain.json";

/**
 * Fetch data for the marketplace. When we are connected to the internet, we fetch the live data.
 * When we are not connected, we use the cached data.
 *
 * @param download boolean - Internet connection status
 * @param url string - URL pointing to the marketplace data
 *
 * @returns Promise
 */
async function fetchMarketplace(download: boolean, url: string): Promise<Marketplace> {
	return window.ipc.getMarketplaceData({
		url,
		download,
	});
}

/**
 * An item in the Marketplace.
 *
 * @param payload - The content for one Item in the Marketplace
 */
function ItemCard({ payload }: { payload: MarketplacePayload }) {
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
		startDecorator = <CircularProgress />;
	} else {
		buttonText = t("labels:download");
		startDecorator = null;
	}

	return (
		<Card variant="soft">
			{payload.images.thumbnail && (
				<CardOverflow sx={{ aspectRatio: 5 / 4 }}>
					<Box
						component="img"
						src={payload.images.thumbnail}
						alt={payload.label}
						loading="lazy"
						sx={{
							position: "absolute",
							inset: 0,
							width: "100%",
							height: "100%",
							objectFit: "cover",
						}}
					/>
				</CardOverflow>
			)}
			<CardContent>
				<Typography level="title-lg" component="h2">
					{payload.label}
				</Typography>
				<Typography level="body-md">{payload.description}</Typography>
				<Typography level="body-sm">{payload.author}</Typography>
				<Button
					disabled={isCompleted || isDownloading}
					color="primary"
					variant="solid"
					startDecorator={startDecorator}
					onClick={download}
				>
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
	const errorMessage = connected ? error?.message : t("texts:notConnectedToTheInternet");

	return (
		<>
			<Head>
				<title>{t("labels:marketplace")}</title>
			</Head>

			<Box
				sx={{
					position: "absolute",
					inset: 0,
					display: "flex",
					flexDirection: "column",
				}}
			>
				<Sheet
					invertedColors
					color="primary"
					variant="soft"
					sx={{ px: 1, py: 0.5, display: "flex", justifyContent: "flex-end" }}
				>
					<Button
						disabled={!connected}
						size="sm"
						startDecorator={isLoading ? <CircularProgress /> : <RefreshIcon />}
						onClick={() => {
							mutate();
						}}
					>
						{t("labels:marketplaceRefresh")}
					</Button>
				</Sheet>
				<Box sx={{ flex: 1, position: "relative" }}>
					{errorMessage && <ErrorMessage error={errorMessage} />}

					{data && (
						<CustomScrollbars>
							{data["stable-diffusion"] && data["stable-diffusion"].checkpoint && (
								<Box sx={{ p: 1 }}>
									<Typography level="h3" component="h2" sx={{ mt: 1, mb: 2 }}>
										Checkpoints
									</Typography>
									<Box
										sx={{
											display: "grid",
											gridTemplateColumns:
												"repeat(auto-fill, minmax(240px, 1fr))",
											gap: 1,
										}}
									>
										{Object.entries(data["stable-diffusion"].checkpoint).map(
											([key, item]: [string, MarketplaceEntry]) => (
												<ItemCard key={key} payload={item.payload} />
											)
										)}
									</Box>
								</Box>
							)}
							{data["stable-diffusion"] && data["stable-diffusion"].vae && (
								<Box sx={{ p: 1 }}>
									<Typography level="h3" component="h2" sx={{ mt: 1, mb: 2 }}>
										VAE
									</Typography>
									<Box
										sx={{
											display: "grid",
											gridTemplateColumns:
												"repeat(auto-fill, minmax(240px, 1fr))",
											gap: 1,
										}}
									>
										{Object.entries(data["stable-diffusion"].vae).map(
											([key, item]: [string, MarketplaceEntry]) => (
												<ItemCard key={key} payload={item.payload} />
											)
										)}
									</Box>
								</Box>
							)}
						</CustomScrollbars>
					)}
				</Box>
			</Box>
		</>
	);
}

export const getStaticProps = makeStaticProperties(["common", "texts", "labels"]);

export { getStaticPaths } from "@/ions/i18n/get-static";
