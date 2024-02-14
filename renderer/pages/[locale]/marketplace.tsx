import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import Box from "@mui/joy/Box";
import Button from "@mui/joy/Button";
import CircularProgress from "@mui/joy/CircularProgress";
import Container from "@mui/joy/Container";
import IconButton from "@mui/joy/IconButton";
import Sheet from "@mui/joy/Sheet";
import Typography from "@mui/joy/Typography";
import { useAtom } from "jotai";
import type { InferGetStaticPropsType } from "next";
import Head from "next/head";
import { useTranslation } from "next-i18next";
import { useEffect, useRef, useState } from "react";
import useSWR from "swr";

export const DEFAULT_MARKETPLACE_URL =
	"https://gist.githubusercontent.com/pixelass/004948226b2ce96b0c6be1ae459f3f42/raw/695bf222fee0c109135ea5b91902046b401175ba/captain-marketplace-test.json";

import {
	CAPTIONS,
	CHECKPOINTS,
	LORAS,
	MARKETPLACE_INDEX,
	MARKETPLACE_INDEX_DATA,
} from "../../../main/helpers/constants";

import { captionsAtom, checkpointsAtom, lorasAtom } from "@/ions/atoms";
import { useScrollPosition } from "@/ions/hooks/scroll-position";
import { makeStaticProperties } from "@/ions/i18n/get-static";
import { CustomScrollbars } from "@/organisms/custom-scrollbars";
import { Lottie } from "@/organisms/lottie";
import { ModelCard } from "@/organisms/model-card";

interface NestedObjectWithOptionalId {
	[key: string]: NestedObjectWithOptionalId | string | boolean | number | null | undefined;
	id?: string;
}

// Define a type for objects that definitely have an id property
interface ObjectWithId {
	id: string;
	[key: string]: any;
}

interface ModelInformation {
	previews: Preview[];
	info: ModelInfo;
	id: string;
}

interface Preview {
	type: string;
	content: string;
}

interface ModelInfo {
	type: string;
	architecture: string;
	title: string;
	author: string;
	link: string;
	license: string;
	files: FileInfo[];
}

interface FileInfo {
	filename: string;
	variant?: string;
	required?: boolean;
}

function findAllParentObjectsWithId<T>(object: NestedObjectWithOptionalId, parents: T[] = []): T[] {
	if (object && typeof object === "object" && "id" in object) {
		// Use a type guard to check if the object has a string id
		const objectWithId: ObjectWithId | undefined =
			typeof object.id === "string" ? { ...object, id: object.id } : undefined;
		if (objectWithId) {
			parents.push(objectWithId as T);
		}
	}

	if (object && typeof object === "object") {
		for (const key in object) {
			if (Object.hasOwn(object, key)) {
				const child = object[key];
				// Check if child is a non-null object but not an array (as arrays might not have id properties in the same sense)
				if (child && typeof child === "object" && !Array.isArray(child)) {
					findAllParentObjectsWithId(child, parents);
				}
			}
		}
	}

	return parents;
}

export function CheckpointsSection() {
	const { t } = useTranslation(["common"]);
	const [, setCheckpoints] = useAtom(checkpointsAtom);
	// TODO create a type for the models
	const [stableDiffusionModels, setStableDiffusionModels] = useState<ModelInformation[]>([]);
	const scrollReference = useRef<HTMLDivElement | null>(null);
	const scrollPosition = useScrollPosition(scrollReference);

	const { data: marketPlaceData } = useSWR(MARKETPLACE_INDEX_DATA);
	const { data: checkpointsData } = useSWR(CHECKPOINTS, () =>
		window.ipc.getModels("checkpoints")
	);

	useEffect(() => {
		if (marketPlaceData && marketPlaceData["stable-diffusion"]?.checkpoint) {
			setStableDiffusionModels(
				findAllParentObjectsWithId<ModelInformation>(
					marketPlaceData["stable-diffusion"]?.checkpoint
				)
			);
		}
	}, [marketPlaceData]);

	useEffect(() => {
		if (checkpointsData) {
			setCheckpoints(checkpointsData);
		}
	}, [checkpointsData, setCheckpoints]);

	return (
		<Container sx={{ py: 2 }}>
			<Box sx={{ py: 2, display: "flex", justifyContent: "space-between" }}>
				<Typography level="h2">
					{t("common:pages.settings.stableDiffusionCheckpoints")}
				</Typography>
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
								type="checkpoints"
								title={stableDiffusionModel.info.title}
								author={stableDiffusionModel.info.author}
								link={stableDiffusionModel.info.link}
								license={stableDiffusionModel.info.license}
								files={stableDiffusionModel.info.files}
								architecture={stableDiffusionModel.info.architecture}
								image={
									stableDiffusionModel.previews.find(
										item => item.type === "image"
									)?.content
								}
							/>
						</Box>
					))}
				</Box>
			</Box>
		</Container>
	);
}

export function LorasSection() {
	const { t } = useTranslation(["common"]);
	const [, setLoras] = useAtom(lorasAtom);
	// TODO create a type for the models
	const [stableDiffusionModels, setStableDiffusionModels] = useState<ModelInformation[]>([]);
	const scrollReference = useRef<HTMLDivElement | null>(null);
	const scrollPosition = useScrollPosition(scrollReference);

	const { data: marketPlaceData } = useSWR(MARKETPLACE_INDEX_DATA);
	const { data: loasData } = useSWR(LORAS, () => window.ipc.getModels("loras"));

	useEffect(() => {
		if (marketPlaceData && marketPlaceData["stable-diffusion"]?.lora) {
			setStableDiffusionModels(
				findAllParentObjectsWithId<ModelInformation>(
					marketPlaceData["stable-diffusion"]?.lora
				)
			);
		}
	}, [marketPlaceData]);

	useEffect(() => {
		if (loasData) {
			setLoras(loasData);
		}
	}, [loasData, setLoras]);

	return (
		<Container sx={{ py: 2 }}>
			<Box sx={{ py: 2, display: "flex", justifyContent: "space-between" }}>
				<Typography level="h2">
					{t("common:pages.settings.stableDiffusionLoras")}
				</Typography>
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
								type="loras"
								title={stableDiffusionModel.info.title}
								author={stableDiffusionModel.info.author}
								link={stableDiffusionModel.info.link}
								license={stableDiffusionModel.info.license}
								files={stableDiffusionModel.info.files}
								architecture={stableDiffusionModel.info.architecture}
								image={
									stableDiffusionModel.previews.find(
										item => item.type === "image"
									)?.content
								}
							/>
						</Box>
					))}
				</Box>
			</Box>
		</Container>
	);
}

export function CaptionsSection() {
	const { t } = useTranslation(["common"]);
	// TODO create a type for the models
	const [, setInstalledCaptionModels] = useAtom(captionsAtom);
	const [captionModels, setCaptionModels] = useState<ModelInformation[]>([]);
	const scrollReference = useRef<HTMLDivElement | null>(null);
	const scrollPosition = useScrollPosition(scrollReference);

	const { data: marketPlaceData } = useSWR(MARKETPLACE_INDEX_DATA);
	const { data: checkpointsData } = useSWR(CAPTIONS, () => window.ipc.getModels("captions"));

	useEffect(() => {
		if (marketPlaceData?.caption) {
			setCaptionModels(findAllParentObjectsWithId<ModelInformation>(marketPlaceData.caption));
		}
	}, [marketPlaceData]);
	useEffect(() => {
		if (checkpointsData) {
			setInstalledCaptionModels(checkpointsData);
		}
	}, [checkpointsData, setInstalledCaptionModels]);

	return (
		<Container sx={{ py: 2 }}>
			<Box sx={{ py: 2, display: "flex", justifyContent: "space-between" }}>
				<Typography level="h2">{t("common:caption")}</Typography>
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
					{captionModels.map(captionModel => (
						<Box
							key={captionModel.id}
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
								id={captionModel.id}
								type="wd14"
								title={captionModel.info.title}
								author={captionModel.info.author}
								link={captionModel.info.link}
								license={captionModel.info.license}
								files={captionModel.info.files}
								architecture={captionModel.info.architecture}
								caption={
									captionModel.previews.find(item => item.type === "text")
										?.content
								}
							/>
						</Box>
					))}
				</Box>
			</Box>
		</Container>
	);
}

export default function Page(_properties: InferGetStaticPropsType<typeof getStaticProps>) {
	const { t } = useTranslation(["common"]);
	const [marketplaceDownloading, setMarketplaceDownloading] = useState(false);

	useEffect(() => {
		const unsubscribe = window.ipc.on(`${MARKETPLACE_INDEX}:updated`, (_event, data) => {
			setMarketplaceDownloading(false);
		});
		return () => {
			unsubscribe();
		};
	}, []);

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
					<Button
						color="primary"
						size="sm"
						startDecorator={
							marketplaceDownloading ? <CircularProgress /> : <CloudDownloadIcon />
						}
						onClick={() => {
							setMarketplaceDownloading(true);
							window.ipc.downloadMarketplace(DEFAULT_MARKETPLACE_URL);
						}}
					>
						{t("common:updateMarketplace")}
					</Button>
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
						<CheckpointsSection />
						<LorasSection />
						<CaptionsSection />
					</CustomScrollbars>
				</Box>
			</Box>
		</>
	);
}

export const getStaticProps = makeStaticProperties(["common"]);

export { getStaticPaths } from "@/ions/i18n/get-static";
