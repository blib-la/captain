import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import Box from "@mui/joy/Box";
import Container from "@mui/joy/Container";
import IconButton from "@mui/joy/IconButton";
import Link from "@mui/joy/Link";
import Sheet from "@mui/joy/Sheet";
import Typography from "@mui/joy/Typography";
import { useAtom } from "jotai";
import { isEqual } from "lodash";
import type { InferGetStaticPropsType } from "next";
import Head from "next/head";
import { useTranslation } from "next-i18next";
import { useEffect, useRef, useState } from "react";
import useSWR from "swr";

import { DATASET, MARKETPLACE_INDEX_DATA } from "../../../main/helpers/constants";

import { checkpointsAtom } from "@/ions/atoms";
import { useScrollPosition } from "@/ions/hooks/scroll-position";
import { makeStaticProperties } from "@/ions/i18n/get-static";
import { CustomScrollbars } from "@/organisms/custom-scrollbars";
import { Lottie } from "@/organisms/lottie";
import { ModelCard } from "@/organisms/model-card";

export default function Page(_properties: InferGetStaticPropsType<typeof getStaticProps>) {
	const { t } = useTranslation(["common"]);
	const [, setCheckpoints] = useAtom(checkpointsAtom);
	// TODO create a type for the models
	const [stableDiffusionModels, setStableDiffusionModels] = useState<any[]>([]);
	const scrollReference = useRef<HTMLDivElement | null>(null);
	const scrollPosition = useScrollPosition(scrollReference);

	const { data: marketPlaceData } = useSWR(MARKETPLACE_INDEX_DATA);
	const { data: checkpointsData } = useSWR(DATASET, () => window.ipc.getModels("checkpoint"));

	useEffect(() => {
		if (marketPlaceData && marketPlaceData["stable-diffusion"].checkpoints) {
			const models = Object.values(marketPlaceData["stable-diffusion"].checkpoints);
			setStableDiffusionModels(previousState =>
				isEqual(previousState, models) ? previousState : models
			);
		}
	}, [marketPlaceData]);

	useEffect(() => {
		if (checkpointsData) {
			setCheckpoints(checkpointsData);
		}
	}, [checkpointsData, setCheckpoints]);

	return (
		<>
			<Head>
				<title>{`Captain | ${t("common:marketplace")}`}</title>
			</Head>
			<Box
				sx={{
					position: "absolute",
					inset: 0,
					display: "flex",
					flexDirection: "column",
					overflow: "hidden",
				}}
			>
				<Sheet
					sx={{
						position: "sticky",
						top: 0,
						display: "flex",
						alignItems: "center",
						height: 44,
						px: 2,
						zIndex: 1,
					}}
				>
					<Typography level="h4" component="h1">
						{t("common:marketplace")}
					</Typography>
					<Box sx={{ flex: 1 }} />
				</Sheet>
				<Box sx={{ flex: 1, position: "relative" }}>
					<CustomScrollbars>
						<Box
							sx={{
								backgroundSize: "100% 100%",
								bgcolor: "common.white",
								"[data-joy-color-scheme='light'] &": {
									bgcolor: "common.black",
								},
							}}
						>
							<Lottie
								invert
								path="/lottie/minimalistic/e-commerce.json"
								height={350}
							/>
						</Box>
						<Container sx={{ py: 2 }}>
							<Box sx={{ py: 2, display: "flex", justifyContent: "space-between" }}>
								<Typography level="h2">Stable Diffusion</Typography>
								<Link>{t("common:seeAll")}</Link>
							</Box>
							<Box sx={{ position: "relative" }}>
								<Box
									sx={{
										position: "absolute",
										zIndex: 2,
										inset: 0,
										display: "flex",
										justifyContent: "space-between",
										alignItems: "center",
										alignContent: "center",
										visibility: "hidden",
										pointerEvents: "none",
									}}
								>
									<IconButton
										variant="solid"
										sx={{
											visibility:
												scrollPosition.scrollable && !scrollPosition.start
													? "visible"
													: "hidden",
											pointerEvents: "all",
										}}
										onClick={() => {
											if (scrollReference.current) {
												// Scroll one full width of the scrollRef Element to the left
												scrollReference.current.scrollBy({
													left: -scrollReference.current.clientWidth,
													behavior: "smooth",
												});
											}
										}}
									>
										<ChevronLeftIcon />
									</IconButton>
									<IconButton
										variant="solid"
										sx={{
											visibility:
												scrollPosition.scrollable && !scrollPosition.end
													? "visible"
													: "hidden",
											pointerEvents: "all",
										}}
										onClick={() => {
											if (scrollReference.current) {
												// Scroll one full width of the scrollRef Element to the right
												scrollReference.current.scrollBy({
													left: scrollReference.current.clientWidth,
													behavior: "smooth",
												});
											}
										}}
									>
										<ChevronRightIcon />
									</IconButton>
								</Box>

								<Box
									ref={scrollReference}
									sx={{
										display: "flex",
										overflow: "auto",
										mx: -1,
										scrollSnapType: "x mandatory",
									}}
								>
									{stableDiffusionModels.map(stableDiffusionModel => (
										<Box
											key={stableDiffusionModel.id}
											sx={{
												display: "flex",
												scrollSnapAlign: "start",
												width: {
													xs: "100%",
													sm: "calc(100% / 2)",
													md: "calc(100% / 3)",
													lg: "calc(100% / 4)",
												},
												flexShrink: 0,
												px: 1,
											}}
										>
											<ModelCard
												id={stableDiffusionModel.id}
												type="checkpoint"
												title={stableDiffusionModel.info.title}
												author={stableDiffusionModel.info.author}
												link={stableDiffusionModel.info.link}
												image={stableDiffusionModel.preview}
												license={stableDiffusionModel.info.license}
												files={stableDiffusionModel.info.files}
												architecture={
													stableDiffusionModel.info.architecture
												}
											/>
										</Box>
									))}
								</Box>
							</Box>
						</Container>
					</CustomScrollbars>
				</Box>
			</Box>
		</>
	);
}

const getStaticProps = makeStaticProperties(["common"]);
export { getStaticProps };

export { getStaticPaths } from "@/ions/i18n/get-static";
