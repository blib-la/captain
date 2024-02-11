import ErrorIcon from "@mui/icons-material/Error";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import PhotoFilterIcon from "@mui/icons-material/PhotoFilter";
import Badge from "@mui/joy/Badge";
import Box from "@mui/joy/Box";
import Button from "@mui/joy/Button";
import CircularProgress from "@mui/joy/CircularProgress";
import FormControl from "@mui/joy/FormControl";
import FormLabel from "@mui/joy/FormLabel";
import Grid from "@mui/joy/Grid";
import Input from "@mui/joy/Input";
import Sheet from "@mui/joy/Sheet";
import Snackbar from "@mui/joy/Snackbar";
import Stack from "@mui/joy/Stack";
import Textarea from "@mui/joy/Textarea";
import { useAtom } from "jotai";
import type { InferGetStaticPropsType } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import type { CSSProperties } from "react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import AutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeGrid } from "react-window";
import useSWR from "swr";

import { CAPTION, CAPTION_RUNNING, DATASET, FOLDER } from "../../../main/helpers/constants";

import { ScreenReaderOnly } from "@/atoms/screen-reader-only";
import {
	captioningErrorAtom,
	captionRunningAtom,
	directoryAtom,
	imagesAtom,
	projectAtom,
	selectedImageAtom,
} from "@/ions/atoms";
import { useColumns } from "@/ions/hooks/columns";
import { makeStaticProperties } from "@/ions/i18n/get-static";
import { CustomScrollbarsVirtualList } from "@/organisms/custom-scrollbars";
import { CaptionModal } from "@/organisms/modals/caption";
import { ZoomImageStage } from "@/organisms/zoomable-image-stage";

export function ImageGridCell({
	columnIndex,
	rowIndex,
	style,
}: {
	columnIndex: number;
	rowIndex: number;
	style: CSSProperties;
}) {
	const reference = useRef<HTMLDivElement>(null);
	const [images] = useAtom(imagesAtom);
	const [selectedImage, setSelectedImage] = useAtom(selectedImageAtom);
	const columnCount = useColumns({ xs: 2, sm: 3, md: 4, lg: 6 });
	const { t } = useTranslation(["common"]);
	const index = rowIndex * columnCount + columnIndex;
	const image = images[index];

	return (
		<Box ref={reference} style={style}>
			{image && (
				<Badge
					color={image.caption ? "success" : "danger"}
					sx={{ mt: 1.5, mr: 1.5 }}
					anchorOrigin={{
						vertical: "top",
						horizontal: "right",
					}}
				>
					<Button
						color={selectedImage === index ? "primary" : "neutral"}
						variant={selectedImage === index ? "solid" : "plain"}
						sx={{ p: 1, position: "relative" }}
						onClick={() => {
							setSelectedImage(index);
						}}
					>
						<img
							src={`my://${image.image}`}
							alt=""
							style={{
								aspectRatio: 1,
								width: "100%",
								height: "auto",
								objectFit: "contain",
							}}
						/>
						<ScreenReaderOnly>{t("common:pages.dataset.selectImage")}</ScreenReaderOnly>
					</Button>
				</Badge>
			)}
		</Box>
	);
}

export function CaptioningError() {
	const [captioningError, setCaptioningError] = useAtom(captioningErrorAtom);

	if (!captioningError) {
		return null;
	}

	return (
		<Snackbar
			open
			invertedColors
			color="danger"
			variant="solid"
			startDecorator={<ErrorIcon />}
			sx={{
				maxWidth: 600,
				".MuiSnackbar-startDecorator": { alignSelf: "flex-start" },
				".MuiSnackbar-endDecorator": { alignSelf: "flex-end" },
			}}
			endDecorator={
				<Button size="sm" onClick={() => setCaptioningError(false)}>
					Dismiss
				</Button>
			}
			onClose={() => {
				setCaptioningError(false);
			}}
		>
			{captioningError}
		</Snackbar>
	);
}

export default function Page(_properties: InferGetStaticPropsType<typeof getStaticProps>) {
	const { query } = useRouter();
	const id = query.id as string | undefined;
	const [images, setImages] = useAtom(imagesAtom);
	const [selectedImage, setSelectedImage] = useAtom(selectedImageAtom);
	const [dataset, setDataset] = useAtom(projectAtom);
	const columnCount = useColumns({ xs: 2, sm: 3, md: 4, lg: 6 });
	const [caption, setCaption] = useState("");
	const [name, setName] = useState("");
	const { t } = useTranslation(["common"]);
	const [captionModalOpen, setCaptionModalOpen] = useState(false);
	const [progress, setProgress] = useState(0);
	const [progressCount, setProgressCount] = useState("");
	const [, setDirectory] = useAtom(directoryAtom);
	const [captionRunning, setCaptionRunning] = useAtom(captionRunningAtom);

	const { data: captionRunningData } = useSWR(CAPTION_RUNNING);

	const { data: datasetData } = useSWR(captionRunningData ? DATASET : undefined, () => {
		if (id) {
			return window.ipc.getDataset(id);
		}
	});

	const saveCaptionToFile = useCallback(async () => {
		const image = images[selectedImage];
		if (image) {
			setImages(
				images.map(image_ =>
					image_.image === image.image ? { ...image_, caption } : image_
				)
			);
			await window.ipc.saveCaption({ ...image, caption });
		}
	}, [images, selectedImage, caption, setImages]);

	//
	// useKeyboardControlledImagesNavigation({ onBeforeChange: saveCaptionToFile });

	useEffect(() => {
		setCaptionRunning(Boolean(captionRunningData));
		if (captionRunningData === false) {
			setProgress(0);
			setProgressCount("");
		}
	}, [captionRunningData, setCaptionRunning]);

	useEffect(() => {
		if (datasetData) {
			setDataset(datasetData.dataset);
			setImages(datasetData.images);
			setName(datasetData.dataset.name);
			setDirectory(datasetData.dataset.files);
		}
		// When datasetData is undefined (initial call) we manually get it from IPC
		// Check if id has is available from query
		else if (id) {
			window.ipc.getDataset(id).then(datasetData_ => {
				setDataset(datasetData_.dataset);
				setImages(datasetData_.images);
				setName(datasetData_.dataset.name);
				setDirectory(datasetData_.dataset.files);
			});
		}
	}, [datasetData, setDataset, setImages, setDirectory, id]);

	// TODO: probably needs adjustment to new mechanism
	// Track progress of potential captioning progress
	useEffect(() => {
		window.ipc.on(
			`${CAPTION}:updated`,
			({
				progress: progress_,
				counter,
				totalCount,
			}: {
				progress: number;
				counter: number;
				totalCount: number;
			}) => {
				console.log(progress_);
				setProgress(progress_);
				setProgressCount(`${counter}/${totalCount}`);
			}
		);
	}, []);

	// Set initially selected image to 0
	useEffect(() => {
		setSelectedImage(0);
	}, [setSelectedImage]);

	// Set caption when an image changes
	useEffect(() => {
		const image = images[selectedImage];
		if (image) {
			setCaption(image.caption ?? "");
		}
	}, [selectedImage, images]);

	return (
		<>
			<Head>
				<title>{`Captain | ${t("common:dataset")}`}</title>
			</Head>
			<CaptioningError />
			<CaptionModal
				open={captionModalOpen && !captionRunning}
				onStart={() => {
					setCaptionRunning(true);
					window.ipc.fetch(CAPTION_RUNNING, { method: "POST", data: true });
				}}
				onDone={async () => {
					if (id) {
						const datasetData_ = await window.ipc.getDataset(id);
						setImages(datasetData_.images);
					}

					setCaptionRunning(false);
					window.ipc.fetch(CAPTION_RUNNING, { method: "POST", data: false });
				}}
				onClose={() => {
					setCaptionModalOpen(false);
				}}
			/>
			<Stack sx={{ position: "absolute", inset: 0 }}>
				<Sheet sx={{ p: 1, display: "flex", gap: 1 }}>
					<Box sx={{ flex: 1 }}>
						{dataset && (
							<Input
								fullWidth
								variant="plain"
								aria-label={t("common:datasetName")}
								value={name}
								onChange={event => {
									setName(event.target.value);
								}}
								onBlur={async event => {
									await window.ipc.updateDataset(dataset.id, {
										name: event.target.value,
									});
								}}
							/>
						)}
					</Box>
					<Button
						startDecorator={<FolderOpenIcon />}
						onClick={() => {
							if (dataset) {
								window.ipc.send(`${FOLDER}:open`, dataset.source);
							}
						}}
					>
						{t("common:openFolder")}
					</Button>
					<Button
						color="primary"
						variant="solid"
						disabled={captionRunning}
						startDecorator={
							captionRunning && progress === 0 ? (
								<CircularProgress />
							) : (
								<PhotoFilterIcon />
							)
						}
						sx={{
							position: "relative",
							overflow: "hidden",
							"&.Mui-disabled": {
								color: captionRunning ? "common.white" : undefined,
							},
							".MuiButton-startDecorator": { position: "relative", zIndex: 1 },
						}}
						onClick={() => {
							if (!captionRunning) {
								setCaptionModalOpen(true);
							}
						}}
					>
						{captionRunning && (
							<Box
								sx={{
									position: "absolute",
									inset: 0,
									zIndex: 0,
									transformOrigin: "0 0",
									transform: `scale3d(${progress}, 1, 1)`,
									bgcolor: "primary.500",
								}}
							/>
						)}
						<Box sx={{ position: "relative", minWidth: 100 }}>
							{captionRunning
								? progressCount || `0/${images.length}`
								: t("common:autoCaption")}
						</Box>
					</Button>
				</Sheet>
				<Grid container spacing={2} columns={{ xs: 1, sm: 2 }} sx={{ flex: 1 }}>
					<Grid xs={1} sx={{ display: "flex" }}>
						<Box sx={{ position: "relative", flex: 1, height: "100%" }}>
							<ZoomImageStage />
						</Box>
					</Grid>
					<Grid xs={1} sx={{ display: "flex" }}>
						<Box sx={{ position: "relative", flex: 1 }}>
							<Stack spacing={2} sx={{ position: "absolute", inset: 0 }}>
								<Box>
									<FormControl sx={{ pr: 1 }}>
										<FormLabel>{t("common:caption")}</FormLabel>
										<Textarea
											minRows={3}
											value={caption}
											onChange={event => {
												setCaption(event.target.value);
											}}
											onBlur={async () => {
												await saveCaptionToFile();
											}}
										/>
									</FormControl>
								</Box>
								<Box
									sx={{
										position: "relative",
										flex: 1,
										".react-window": {
											WebkitOverflowScrolling: "touch",
										},
									}}
								>
									<AutoSizer>
										{({ height, width }) => {
											const columnWidth = width / columnCount;

											return (
												<FixedSizeGrid
													outerElementType={CustomScrollbarsVirtualList}
													className="react-window"
													columnCount={columnCount}
													columnWidth={columnWidth}
													height={height}
													rowHeight={columnWidth}
													width={width}
													rowCount={Math.ceil(
														images.length / columnCount
													)}
												>
													{ImageGridCell}
												</FixedSizeGrid>
											);
										}}
									</AutoSizer>
								</Box>
							</Stack>
						</Box>
					</Grid>
				</Grid>
			</Stack>
		</>
	);
}

export const getStaticProps = makeStaticProperties(["common"]);

export { getStaticPaths } from "@/ions/i18n/get-static";
