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

import { CAPTION_RUNNING, DATASET, FOLDER } from "../../../main/helpers/constants";

import { ScreenReaderOnly } from "@/atoms/screen-reader-only";
import {
	captionRunningAtom,
	directoryAtom,
	imagesAtom,
	projectAtom,
	selectedImageAtom,
} from "@/ions/atoms";
import { useColumns } from "@/ions/hooks/columns";
import { useKeyboardControlledImagesNavigation } from "@/ions/hooks/keyboard-controlled-images-navigation";
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

export default function Page(_properties: InferGetStaticPropsType<typeof getStaticProps>) {
	const { query } = useRouter();
	const id = query.id as string;
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

	const { data: imagesData } = useSWR("", () => {
		if (dataset) {
			return window.ipc.getExistingProject(dataset);
		}
	});

	const { data: datasetData } = useSWR(DATASET, () => window.ipc.getDataset(id));

	const saveCaptionToFile = useCallback(async () => {
		const image = images[selectedImage];
		if (image) {
			await window.ipc.saveCaption({ ...image, caption });
			setImages(
				images.map(image_ =>
					image_.image === image.image ? { ...image_, caption } : image_
				)
			);
		}
	}, [images, selectedImage, caption, setImages]);

	useKeyboardControlledImagesNavigation({ onBeforeChange: saveCaptionToFile });

	useEffect(() => {
		setCaptionRunning(Boolean(captionRunningData));
		if (!captionRunningData) {
			setProgress(0);
			setProgressCount("");
		}
	}, [captionRunningData, setCaptionRunning]);

	useEffect(() => {
		if (imagesData) {
			setImages(imagesData);
		}
	}, [imagesData, setImages]);

	useEffect(() => {
		if (datasetData) {
			setDataset(datasetData.dataset);
			setImages(datasetData.images);
			setDirectory(datasetData.source);
		}
	}, [datasetData, setDataset, setImages, setDirectory]);

	useEffect(() => {
		if (images[selectedImage]) {
			setCaption(images[selectedImage].caption ?? "");
		}
	}, [selectedImage, images]);

	useEffect(() => {
		if (id) {
			window.ipc.getDataset(id).then(dataset_ => {
				setDataset(dataset_.dataset);
				setImages(dataset_.images);
				setDirectory(dataset_.dataset.source);
			});
		}
	}, [id, setDataset, setDirectory, setImages]);

	useEffect(() => {
		const image = images[selectedImage];
		if (image) {
			setCaption(image.caption ?? "");
		}
	}, [selectedImage, images]);

	useEffect(() => {
		setSelectedImage(0);
	}, [setSelectedImage]);

	useEffect(() => {
		if (dataset) {
			setName(dataset.name);
		}
	}, [dataset]);

	useEffect(() => {
		window.ipc.on("caption-progress", ({ percent, completedCount, totalCount }: any) => {
			setProgress(percent);
			setProgressCount(`${completedCount}/${totalCount}`);
		});
	}, []);

	return (
		<>
			<Head>
				<title>{`Captain | ${t("common:dataset")}`}</title>
			</Head>
			<CaptionModal
				open={captionModalOpen && !captionRunning}
				onStart={() => {
					setCaptionRunning(true);
					window.ipc.fetch(CAPTION_RUNNING, { method: "POST", data: true });
				}}
				onDone={async () => {
					if (dataset) {
						const content = await window.ipc.getExistingProject(dataset);
						setImages(content);
					}

					setCaptionRunning(false);
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
									transform: `scale3d(${progress / 100}, 1, 1)`,
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
											onChange={event => setCaption(event.target.value)}
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
