import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CloseIcon from "@mui/icons-material/Close";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import ImageIcon from "@mui/icons-material/Image";
import PhotoFilterIcon from "@mui/icons-material/PhotoFilter";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import SettingsIcon from "@mui/icons-material/Settings";
import StyleIcon from "@mui/icons-material/Style";
import VisibilityIcon from "@mui/icons-material/Visibility";
import WarningIcon from "@mui/icons-material/Warning";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import Alert from "@mui/joy/Alert";
import Badge from "@mui/joy/Badge";
import Box from "@mui/joy/Box";
import Button from "@mui/joy/Button";
import ButtonGroup from "@mui/joy/ButtonGroup";
import CircularProgress from "@mui/joy/CircularProgress";
import FormControl from "@mui/joy/FormControl";
import FormLabel from "@mui/joy/FormLabel";
import Grid from "@mui/joy/Grid";
import IconButton from "@mui/joy/IconButton";
import Input from "@mui/joy/Input";
import Link from "@mui/joy/Link";
import Modal from "@mui/joy/Modal";
import ModalClose from "@mui/joy/ModalClose";
import ModalDialog from "@mui/joy/ModalDialog";
import Sheet from "@mui/joy/Sheet";
import Stack from "@mui/joy/Stack";
import { styled } from "@mui/joy/styles";
import Textarea from "@mui/joy/Textarea";
import Tooltip from "@mui/joy/Tooltip";
import Typography from "@mui/joy/Typography";
import { useAtom } from "jotai";
import type { InferGetStaticPropsType } from "next";
import dynamic from "next/dynamic";
import Head from "next/head";
import { useRouter } from "next/router";
import { Trans, useTranslation } from "next-i18next";
import type { CSSProperties } from "react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import AutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeGrid } from "react-window";
import type { ReactZoomPanPinchContentRef } from "react-zoom-pan-pinch";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import useSWR from "swr";

import {
	CAPTION_RUNNING,
	FOLDER,
	GPT_VISION_OPTIONS,
	OPENAI_API_KEY,
} from "../../../main/helpers/constants";

import { ScreenReaderOnly } from "@/atoms/screen-reader-only";
import {
	captionRunningAtom,
	directoryAtom,
	imagesAtom,
	modelDownloadNoteAtom,
	projectAtom,
	selectedImageAtom,
} from "@/ions/atoms";
import { useColumns } from "@/ions/hooks";
import { makeStaticProperties } from "@/ions/i18n/get-static";
import { CustomScrollbarsVirtualList } from "@/organisms/custom-scrollbars";
import { PasswordField } from "@/organisms/password-field";

export const CodeMirror = dynamic(
	() => import("react-codemirror2").then(module_ => module_.Controlled),
	{ ssr: false }
);

export function Cell({
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

function Controls({ zoomIn, zoomOut, resetTransform }: ReactZoomPanPinchContentRef) {
	const { t } = useTranslation(["common"]);
	return (
		<Sheet sx={{ p: 0.5 }}>
			<ButtonGroup variant="soft" size="sm">
				<IconButton
					aria-label={t("common:zoomIn")}
					onClick={() => {
						zoomIn();
					}}
				>
					<ZoomInIcon />
				</IconButton>
				<IconButton
					aria-label={t("common:zoomOut")}
					onClick={() => {
						zoomOut();
					}}
				>
					<ZoomOutIcon />
				</IconButton>
				<IconButton
					aria-label={t("common:resetTransform")}
					onClick={() => {
						resetTransform();
					}}
				>
					<SearchOffIcon />
				</IconButton>
			</ButtonGroup>
		</Sheet>
	);
}

export function BigImage() {
	const [images] = useAtom(imagesAtom);
	const [selectedImage, setSelectedImage] = useAtom(selectedImageAtom);
	const { t } = useTranslation(["common"]);
	return (
		<Box
			sx={{
				inset: 0,
				position: "absolute",
				overflow: "hidden",
				".react-transform-wrapper, .react-transform-component": {
					height: "100%",
					width: "100%",
				},
			}}
		>
			{images[selectedImage] && (
				<Box sx={{ position: "relative", height: "100%", width: "100%" }}>
					<TransformWrapper
						wheel={{
							step: 0.001,
							smoothStep: 0.001,
						}}
					>
						{utils => (
							<Box
								sx={{
									position: "absolute",
									inset: 0,
								}}
							>
								<Controls {...utils} />
								<Box
									sx={{
										position: "absolute",
										top: 40,
										left: 0,
										right: 0,
										bottom: 0,
									}}
								>
									<IconButton
										variant="solid"
										aria-label={t("common:previous")}
										sx={{
											position: "absolute",
											top: "50%",
											left: 4,
											zIndex: 2,
											transform: "translateY(-50%)",
										}}
										onClick={() => {
											setSelectedImage(
												(images.length + selectedImage - 1) % images.length
											);
											utils.resetTransform();
										}}
									>
										<ChevronLeftIcon />
									</IconButton>
									<IconButton
										variant="solid"
										aria-label={t("common:next")}
										sx={{
											position: "absolute",
											top: "50%",
											right: 4,
											zIndex: 2,
											transform: "translateY(-50%)",
										}}
										onClick={() => {
											setSelectedImage((selectedImage + 1) % images.length);
											utils.resetTransform();
										}}
									>
										<ChevronRightIcon />
									</IconButton>
									<TransformComponent>
										<img
											src={`my://${images[selectedImage].image}`}
											alt=""
											style={{
												flex: 1,
												width: "100%",
												height: "100%",
												objectFit: "contain",
											}}
										/>
									</TransformComponent>
								</Box>
							</Box>
						)}
					</TransformWrapper>
				</Box>
			)}
		</Box>
	);
}

export const StyledEditor = styled(CodeMirror)({
	height: "100%",
	">.CodeMirror": {
		height: "100%",
	},
});
export function CaptionModal({
	open,
	onClose,
	onStart,
	onDone,
}: {
	onClose(): void | Promise<void>;
	onStart(): void | Promise<void>;
	onDone(): void | Promise<void>;
	open: boolean;
}) {
	const [openAiApiKey, setOpenAiApiKey] = useState("");
	const [gptVisionOptions, setGptVisionOptions] = useState({
		batchSize: 10,
		guidelines: `Please caption these images, separate groups by comma, ensure logical groups: "black torn wide pants" instead of "black, torn, wide pants"`,
		exampleResponse: `[
  "a photo of a young man, red hair, blue torn overalls, white background",
  "a watercolor painting of an elderly woman, grey hair, floral print sundress, pink high heels, looking at a castle in the distance"
]`,
	});
	const [confirmGpt, setConfirmGpt] = useState(false);
	const [showGptOptions, setShowGptOptions] = useState(false);
	const [directory] = useAtom(directoryAtom);
	const { t } = useTranslation(["common"]);
	const [modelDownloadNote, setModelDownloadNote] = useAtom(modelDownloadNoteAtom);

	const { data: openApiKeyData } = useSWR(OPENAI_API_KEY);
	const { data: gptVisionData } = useSWR(GPT_VISION_OPTIONS);

	useEffect(() => {
		if (openApiKeyData) {
			setOpenAiApiKey(openApiKeyData);
		}
	}, [openApiKeyData]);

	useEffect(() => {
		if (gptVisionData) {
			setGptVisionOptions(
				gptVisionData as {
					batchSize: number;
					guidelines: string;
					exampleResponse: string;
				}
			);
		}
	}, [gptVisionData]);

	return (
		<Modal keepMounted open={open} onClose={onClose}>
			<ModalDialog
				sx={{
					display: "flex",
					flexDirection: "column",
					pt: 6,
				}}
			>
				<ModalClose aria-label={t("common:close")} />
				<Typography>{t("common:pages.dataset.chooseCaptioningMethod")}:</Typography>

				<Box sx={{ overflow: "auto", WebkitOverflowScrolling: "touch" }}>
					<Stack
						spacing={2}
						sx={{
							minHeight: "100%",
							justifyContent: "center",
							width: 600,
							mx: "auto",
						}}
					>
						{modelDownloadNote && (
							<Alert
								color="warning"
								startDecorator={<WarningIcon />}
								endDecorator={
									<IconButton
										color="warning"
										variant="solid"
										onClick={() => {
											setModelDownloadNote(false);
										}}
									>
										<CloseIcon />
									</IconButton>
								}
								sx={{
									".MuiAlert-endDecorator": {
										alignSelf: "flex-start",
										mt: -0.5,
										mr: -0.5,
									},
								}}
							>
								{t("common:pages.dataset.oneTimeDownloadNote")}
							</Alert>
						)}
						<ButtonGroup variant="solid" sx={{ width: "100%" }}>
							<Button
								startDecorator={<ImageIcon />}
								sx={{ flex: 1 }}
								onClick={async () => {
									onStart();
									onClose();
									await window.ipc.handleRunBlip(directory);
									onDone();
								}}
							>
								{t("common:pages.dataset.generateCaptionWithBLIP")}
							</Button>
							<Tooltip disableInteractive title="BLIP Settings">
								<IconButton disabled>
									<SettingsIcon />
								</IconButton>
							</Tooltip>
						</ButtonGroup>
						<ButtonGroup variant="solid" sx={{ width: "100%" }}>
							<Button
								startDecorator={<StyleIcon />}
								sx={{ flex: 1 }}
								onClick={async () => {
									onStart();
									onClose();
									await window.ipc.handleRunWd14(directory);
									onDone();
								}}
							>
								{t("common:pages.dataset.generateTagsWithWD14")}
							</Button>
							<Tooltip disableInteractive title="WD14 Settings">
								<IconButton disabled>
									<SettingsIcon />
								</IconButton>
							</Tooltip>
						</ButtonGroup>
						<ButtonGroup variant="solid" sx={{ width: "100%" }}>
							<Button
								color="warning"
								startDecorator={<VisibilityIcon />}
								sx={{ flex: 1 }}
								onClick={async () => {
									setConfirmGpt(!confirmGpt);
								}}
							>
								{t("common:pages.dataset.customCaptionsWithGPTVision")}
							</Button>
							<Tooltip disableInteractive title="GPT-Vision Settings">
								<IconButton
									color="warning"
									onClick={() => {
										setShowGptOptions(!showGptOptions);
									}}
								>
									<SettingsIcon />
								</IconButton>
							</Tooltip>
						</ButtonGroup>
						{confirmGpt && (
							<Stack spacing={2}>
								<Alert color="warning" startDecorator={<WarningIcon />}>
									<Typography>
										<Trans
											i18nKey="common:pages.dataset.warningOpenAI"
											components={{
												1: (
													<Link
														href="https://openai.com/policies/terms-of-use"
														target="_blank"
													/>
												),
											}}
										/>
									</Typography>
								</Alert>
								{!openAiApiKey && (
									<Typography>
										{t("common:pages.dataset.enterKeyToUseGPTVision")}{" "}
										<Link
											href="https://platform.openai.com/api-keys"
											target="_blank"
										>
											{t("common:getApiKey")}
										</Link>
									</Typography>
								)}
								<Button
									disabled={!openAiApiKey}
									color="danger"
									startDecorator={<VisibilityIcon />}
									sx={{ flex: 1 }}
									onClick={async () => {
										onStart();
										onClose();
										console.log({ gptVisionOptions });
										await window.ipc.handleRunGPTV(directory, gptVisionOptions);
										onDone();
									}}
								>
									{t("common:pages.dataset.proceedWithGPTVision")}
								</Button>
							</Stack>
						)}
						{showGptOptions && (
							<Box>
								<PasswordField
									fullWidth
									aria-label={t("common:openAiApiKey")}
									label={t("common:openAiApiKey")}
									value={openAiApiKey}
									onChange={event => {
										setOpenAiApiKey(event.target.value);
									}}
									onBlur={event => {
										window.ipc.fetch(OPENAI_API_KEY, {
											method: "POST",
											data: event.target.value,
										});
									}}
								/>
								<Typography sx={{ my: 1 }}>{t("common:guideline")}</Typography>
								<Box sx={{ height: 200 }}>
									<StyledEditor
										value={gptVisionOptions.guidelines}
										options={{
											mode: "markdown",
											theme: "material",
											lineWrapping: true,
										}}
										onBeforeChange={(editor, data, value) => {
											setGptVisionOptions({
												...gptVisionOptions,
												guidelines: value,
											});
											window.ipc.fetch(GPT_VISION_OPTIONS, {
												method: "POST",
												data: {
													...gptVisionOptions,
													guidelines: value,
												},
											});
										}}
									/>
								</Box>
								<Typography sx={{ my: 1 }}>
									{t("common:exampleResponse")}
								</Typography>
								<Box sx={{ height: 200 }}>
									<StyledEditor
										value={gptVisionOptions.exampleResponse}
										options={{
											mode: "application/ld+json",
											theme: "material",
											lineWrapping: true,
										}}
										onBeforeChange={(editor, data, value) => {
											setGptVisionOptions({
												...gptVisionOptions,
												exampleResponse: value,
											});
											window.ipc.fetch(GPT_VISION_OPTIONS, {
												method: "POST",
												data: {
													...gptVisionOptions,
													exampleResponse: value,
												},
											});
										}}
									/>
								</Box>
							</Box>
						)}
					</Stack>
				</Box>
			</ModalDialog>
		</Modal>
	);
}

export function useKeyboardControls({
	onBeforeChange,
}: {
	onBeforeChange(): Promise<void> | void;
}) {
	const [images] = useAtom(imagesAtom);
	const [selectedImage, setSelectedImage] = useAtom(selectedImageAtom);
	const columnCount = useColumns({ xs: 2, sm: 3, md: 4, lg: 6 });
	const { length: imagesLength } = images;
	const goRowUp = useCallback(() => {
		if (selectedImage > columnCount - 1) {
			setSelectedImage(selectedImage - columnCount);
		} else {
			setSelectedImage(imagesLength - 1);
		}
	}, [selectedImage, columnCount, setSelectedImage, imagesLength]);

	const goRowDown = useCallback(() => {
		if (selectedImage < imagesLength - columnCount) {
			setSelectedImage(selectedImage + columnCount);
		} else {
			setSelectedImage(0);
		}
	}, [selectedImage, imagesLength, columnCount, setSelectedImage]);

	const goToPrevious = useCallback(() => {
		if (selectedImage > 0) {
			setSelectedImage(selectedImage - 1);
		} else {
			setSelectedImage(imagesLength - 1);
		}
	}, [selectedImage, setSelectedImage, imagesLength]);

	const goToNext = useCallback(() => {
		if (selectedImage < imagesLength - 1) {
			setSelectedImage(selectedImage + 1);
		} else {
			setSelectedImage(0);
		}
	}, [selectedImage, imagesLength, setSelectedImage]);

	useEffect(() => {
		async function handleKeyDown(event: KeyboardEvent) {
			if (event.altKey) {
				switch (event.key) {
					case "ArrowLeft": {
						await onBeforeChange();
						goToPrevious();
						break;
					}

					case "ArrowRight": {
						await onBeforeChange();
						goToNext();
						break;
					}

					case "ArrowUp": {
						await onBeforeChange();
						goRowUp();
						break;
					}

					case "ArrowDown": {
						await onBeforeChange();
						goRowDown();
						break;
					}

					default: {
						break;
					}
				}
			}
		}

		window.addEventListener("keydown", handleKeyDown);

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [goToPrevious, goToNext, goRowUp, columnCount, onBeforeChange, goRowDown]);
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

	useKeyboardControls({ onBeforeChange: saveCaptionToFile });

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

	// UsePollingEffect(
	// 	() => {
	// 		if (id) {
	// 			window.ipc.getDataset(id).then(dataset_ => {
	// 				setDataset(dataset_.dataset);
	// 				setImages(dataset_.images);
	// 				setDirectory(dataset_.dataset.source);
	// 			});
	// 		}
	// 	},
	// 	{ interval: 2000, initialInterval: 300, initialCount: 2 }
	// );

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
							<BigImage />
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
													{Cell}
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

const getStaticProps = makeStaticProperties(["common"]);
export { getStaticProps };

export { getStaticPaths } from "@/ions/i18n/get-static";
