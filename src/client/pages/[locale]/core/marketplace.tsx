import { CustomScrollbars } from "@captn/joy/custom-scrollbars";
import { useRequiredDownloads } from "@captn/react/use-required-downloads";
import CheckCircle from "@mui/icons-material/CheckCircle";
import DownloadIcon from "@mui/icons-material/Download";
import LinkIcon from "@mui/icons-material/Link";
import RefreshIcon from "@mui/icons-material/Refresh";
import WarningIcon from "@mui/icons-material/Warning";
import Alert from "@mui/joy/Alert";
import Box from "@mui/joy/Box";
import Button from "@mui/joy/Button";
import Card from "@mui/joy/Card";
import CardContent from "@mui/joy/CardContent";
import CardOverflow from "@mui/joy/CardOverflow";
import Chip from "@mui/joy/Chip";
import CircularProgress from "@mui/joy/CircularProgress";
import JoyLink from "@mui/joy/Link";
import Sheet from "@mui/joy/Sheet";
import Typography from "@mui/joy/Typography";
import { useAtom } from "jotai";
import { sortBy } from "lodash";
import type { InferGetStaticPropsType } from "next";
import Head from "next/head";
import { useTranslation } from "next-i18next";
import React, { useEffect, useState } from "react";
import useSWR from "swr";

import { requiresRestartAtom } from "@/client/ions/atoms";
import { useOnlineStatus } from "@/client/ions/hooks/online-status";
import { makeStaticProperties } from "@/client/ions/i18n/get-static";
import type { Marketplace, Payload as MarketplacePayload } from "@/shared/types/marketplace";

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

const architectureColors = {
	python: "grey",
	sdxl: "blue",
	"sdxl-turbo": "violet",
	"sd-2-1-turbo": "pink",
	"sd-2-1": "orange",
	"sd-1-5": "yellow",
} as const;

const architectureLabels = {
	python: "Python",
	sdxl: "SDXL",
	"sdxl-turbo": "SDXL turbo",
	"sd-2-1-turbo": "SD turbo",
	"sd-2-1": "SD 2.1",
	"sd-1-5": "SD 1.5",
} as const;

type Architecture = keyof typeof architectureColors;
/**
 * An item in the Marketplace.
 *
 * @param payload - The content for one Item in the Marketplace
 */
function ItemCard({ payload }: { payload: MarketplacePayload }) {
	const { t } = useTranslation(["labels"]);
	const [, setRequiresRestart] = useAtom(requiresRestartAtom);
	const [mayRequireRestart, setMayRequireRestart] = useState(false);

	const { download, isCompleted, isDownloading } = useRequiredDownloads(payload.sources);
	const { type } = payload;

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
		startDecorator = <DownloadIcon />;
	}

	useEffect(() => {
		if (!isCompleted && ["app", "comfyui-extension"].includes(type)) {
			setMayRequireRestart(true);
		}
	}, [isCompleted, type]);

	useEffect(() => {
		if (isCompleted && mayRequireRestart) {
			setRequiresRestart(true);
		}
	}, [isCompleted, mayRequireRestart, setRequiresRestart]);
	console.log(payload);

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
					<JoyLink
						href={payload.link}
						target="_blank"
						sx={{
							position: "absolute",
							top: 0,
							left: 0,
							m: 0.5,
							p: 0.5,
							display: "flex",
							".MuiCard-root:hover &": {
								bgcolor: "background.body",
							},
							".MuiCard-root:hover &:hover": {
								bgcolor: "background.level1",
							},
							".MuiCard-root:hover &:active": {
								bgcolor: "background.level2",
							},
						}}
					>
						<LinkIcon />
					</JoyLink>
					<Box sx={{ position: "absolute", bottom: 0, right: 0, m: 0.5 }}>
						<Chip variant="plain">{payload.license}</Chip>
					</Box>
					<Box sx={{ position: "absolute", top: 0, right: 0, m: 0.5 }}>
						<Chip
							variant="soft"
							color={architectureColors[payload.architecture as Architecture]}
						>
							{architectureLabels[
								payload.architecture as keyof typeof architectureLabels
							] ?? payload.architecture}
						</Chip>
					</Box>
				</CardOverflow>
			)}
			<CardContent>
				<Typography level="title-lg" component="h2">
					{payload.label}
				</Typography>
				<Chip color="neutral" variant="outlined">
					{payload.author}
				</Chip>
				<Box sx={{ flex: 1 }}>
					<Typography level="body-md" mb={1}>
						{payload.description}
					</Typography>
				</Box>
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
 * Show an alert for every error that happens.
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
							<Box sx={{ minHeight: "100%", pb: 2 }}>
								{data.apps && (
									<Box sx={{ px: 1, pb: 2 }}>
										<Sheet
											sx={{
												position: "sticky",
												top: 0,
												zIndex: 2,
												display: "flex",
											}}
										>
											<Typography level="h3" component="h2" sx={{ my: 1 }}>
												Apps
											</Typography>
										</Sheet>
										<Box
											sx={{
												display: "grid",
												gridTemplateColumns:
													"repeat(auto-fill, minmax(240px, 1fr))",
												gap: 1,
											}}
										>
											{sortBy(Object.values(data.apps), "payload.label").map(
												item => (
													<ItemCard
														key={item.id}
														payload={item.payload}
													/>
												)
											)}
										</Box>
									</Box>
								)}
								{data["stable-diffusion"] && data["stable-diffusion"].lora && (
									<Box sx={{ px: 1, pb: 2 }}>
										<Sheet
											sx={{
												position: "sticky",
												top: 0,
												zIndex: 2,
												display: "flex",
											}}
										>
											<Typography level="h3" component="h2" sx={{ my: 1 }}>
												LoRA
											</Typography>
										</Sheet>
										<Box
											sx={{
												display: "grid",
												gridTemplateColumns:
													"repeat(auto-fill, minmax(240px, 1fr))",
												gap: 1,
											}}
										>
											{sortBy(
												Object.values(data["stable-diffusion"].lora),
												"payload.label"
											).map(item => (
												<ItemCard key={item.id} payload={item.payload} />
											))}
										</Box>
									</Box>
								)}

								{data["stable-diffusion"] &&
									data["stable-diffusion"].checkpoint && (
										<Box sx={{ px: 1, pb: 2 }}>
											<Sheet
												sx={{
													position: "sticky",
													top: 0,
													zIndex: 2,
													display: "flex",
												}}
											>
												<Typography
													level="h3"
													component="h2"
													sx={{ my: 1 }}
												>
													Checkpoints
												</Typography>
											</Sheet>
											<Box
												sx={{
													display: "grid",
													gridTemplateColumns:
														"repeat(auto-fill, minmax(240px, 1fr))",
													gap: 1,
												}}
											>
												{sortBy(
													Object.values(
														data["stable-diffusion"].checkpoint
													),
													"payload.label"
												).map(item => (
													<ItemCard
														key={item.id}
														payload={item.payload}
													/>
												))}
											</Box>
										</Box>
									)}

								{data["stable-diffusion"] && data["stable-diffusion"].vae && (
									<Box sx={{ px: 1, pb: 2 }}>
										<Sheet
											sx={{
												position: "sticky",
												top: 0,
												zIndex: 2,
												display: "flex",
											}}
										>
											<Typography level="h3" component="h2" sx={{ my: 1 }}>
												VAE
											</Typography>
										</Sheet>
										<Box
											sx={{
												display: "grid",
												gridTemplateColumns:
													"repeat(auto-fill, minmax(240px, 1fr))",
												gap: 1,
											}}
										>
											{sortBy(
												Object.values(data["stable-diffusion"].vae),
												"payload.label"
											).map(item => (
												<ItemCard key={item.id} payload={item.payload} />
											))}
										</Box>
									</Box>
								)}

								{data.comfyui && data.comfyui.custom_nodes && (
									<Box sx={{ px: 1, pb: 2 }}>
										<Sheet
											sx={{
												position: "sticky",
												top: 0,
												zIndex: 2,
												display: "flex",
											}}
										>
											<Typography level="h3" component="h2" sx={{ my: 1 }}>
												ComfyUI
											</Typography>
										</Sheet>
										<Box
											sx={{
												display: "grid",
												gridTemplateColumns:
													"repeat(auto-fill, minmax(240px, 1fr))",
												gap: 1,
											}}
										>
											{sortBy(
												Object.values(data.comfyui.custom_nodes),
												"payload.label"
											).map(item => (
												<ItemCard key={item.id} payload={item.payload} />
											))}
										</Box>
									</Box>
								)}
							</Box>
						</CustomScrollbars>
					)}
				</Box>
			</Box>
		</>
	);
}

export const getStaticProps = makeStaticProperties(["common", "texts", "labels"]);

export { getStaticPaths } from "@/client/ions/i18n/get-static";
