import { useResettableState } from "@captn/react/use-resettable-state";
import { useSDK } from "@captn/react/use-sdk";
import { useUnload } from "@captn/react/use-unload";
import BrushIcon from "@mui/icons-material/Brush";
import CasinoIcon from "@mui/icons-material/Casino";
import CheckIcon from "@mui/icons-material/Check";
import ClearIcon from "@mui/icons-material/Clear";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import SaveIcon from "@mui/icons-material/Save";
import StopIcon from "@mui/icons-material/Stop";
import Box from "@mui/joy/Box";
import Button from "@mui/joy/Button";
import CircularProgress from "@mui/joy/CircularProgress";
import Sheet from "@mui/joy/Sheet";
import Switch from "@mui/joy/Switch";
import Typography from "@mui/joy/Typography";
import { useAtom } from "jotai";
import { useTranslation } from "next-i18next";
import { useCallback, useEffect, useRef, useState } from "react";

import { clearCounterAtom, imageAtom, livePaintingOptionsAtom } from "./atoms";
import { ColorInputButton, PopupSlider, TooltipButton } from "./components";
import { allRequiredDownloads, APP_ID, FRAMES_PER_SECOND, MAX_QUEUE_LENGTH } from "./constants";
import { createWorkflow } from "./create-workflow";
import { DrawingArea } from "./drawing-area";

import { PromptSheet } from "@/client/apps/shared/components";
import type { IllustrationStyles } from "@/client/apps/shared/illustration-styles";
import { illustrationStyles, injectPrompt } from "@/client/apps/shared/illustration-styles";
import { RenderingArea } from "@/client/apps/shared/rendering-area";
import { RequiredModelsAlert } from "@/client/apps/shared/required-models-alert";
import {
	StyledButtonWrapper,
	StyledDrawingAreaWrapper,
	StyledRenderingAreaWrapper,
	StyledStickyHeader,
} from "@/client/apps/shared/styled";
import type {
	ComfyCached,
	ComfyExecuted,
	ComfyExecuting,
	ComfyStatusMessage,
} from "@/client/apps/shared/types";
import { comfyUITemporaryPathAtom } from "@/client/ions/atoms";
import { useComfyUIPath } from "@/client/ions/hooks/comfyui-path";
import { buildKey } from "@/shared/build-key";
import { ID } from "@/shared/enums";
import { randomSeed } from "@/shared/number";

export function SaveButton({
	image,
	prompt,
	fileName,
}: {
	image: string;
	prompt: string;
	fileName: string;
}) {
	const { t } = useTranslation(["common", "labels"]);
	const [saved, setSaved] = useResettableState(false, 3000);
	const promptCache = useRef(prompt);
	const imageCache = useRef(image);

	const saveImage = useCallback(async () => {
		if (fileName && image) {
			window.ipc.send(buildKey([ID.FILE], { suffix: ":copy-image-with-metadata" }), {
				source: image,
				destination: `images/${fileName}`,
				metadata: { description: prompt },
			});
		}

		setSaved(true);
	}, [image, setSaved, fileName, prompt]);

	useEffect(() => {
		if (imageCache.current !== image) {
			promptCache.current = prompt;
		}

		imageCache.current = image;
	}, [image, prompt]);

	useEffect(() => {
		async function handleSave(event: KeyboardEvent) {
			if (event.key === "s" && event.ctrlKey) {
				event.preventDefault();
				await saveImage();
			}
		}

		window.addEventListener("keydown", handleSave);
		return () => {
			window.removeEventListener("keydown", handleSave);
		};
	}, [saveImage]);

	return (
		<Button
			color={saved ? "success" : "neutral"}
			variant="soft"
			startDecorator={saved ? <CheckIcon /> : <SaveIcon />}
			onClick={saveImage}
		>
			{saved ? t("labels:saved") : t("labels:save")}
		</Button>
	);
}

export function LivePainting() {
	const { t } = useTranslation(["common", "labels"]);

	// Local States
	const [isOverlay, setIsOverlay] = useState(false);
	const [prompt, setPrompt] = useState("");
	const [illustrationStyle, setIllustrationStyle] = useState<IllustrationStyles>("childrensBook");
	const [seed, setSeed] = useState(randomSeed());
	const [fileName, setFileName] = useState("");
	const startedReference = useRef(false);
	const [started, setStarted] = useState(false);
	const [isGenerating, setIsGenerating] = useState(false);

	// Global States
	const [livePaintingOptions, setLivePaintingOptions] = useAtom(livePaintingOptionsAtom);
	const [image, setImage] = useAtom(imageAtom);
	const [, setClearCounter] = useAtom(clearCounterAtom);
	const receivedReference = useRef(false);
	const [comfyUITemporaryPath] = useAtom(comfyUITemporaryPathAtom);

	const { send } = useSDK<unknown, unknown>(APP_ID, {
		onMessage(message) {
			switch (message.action) {
				case "comfyui:update": {
					const { data } = message.payload as {
						data: ComfyExecuted | ComfyExecuting | ComfyCached | ComfyStatusMessage;
					};
					console.log(data);
					switch (data.type) {
						case "status": {
							receivedReference.current =
								data.data.status.exec_info.queue_remaining < MAX_QUEUE_LENGTH;

							break;
						}

						case "execution_cached": {
							setIsGenerating(false);
							break;
						}

						case "executed": {
							const { filename, subfolder } = data.data.output.images[0];
							const temporaryImage =
								`${comfyUITemporaryPath}/${subfolder}/${filename}`.replaceAll(
									/\?+/g,
									"/"
								);
							setImage(temporaryImage);
							setFileName(filename);
							setIsGenerating(false);

							break;
						}

						default: {
							break;
						}
					}

					break;
				}

				default: {
					break;
				}
			}
		},
	});

	useUnload(APP_ID, "comfyui:unregisterClient", {});

	useEffect(() => {
		send({
			action: "comfyui:registerClient",
			payload: {},
		});
		return () => {
			send({
				action: "comfyui:unregisterClient",
				payload: {},
			});
		};
	}, [send]);

	useEffect(() => {
		let animationFrame = -1;
		const fpsInterval = 1000 / FRAMES_PER_SECOND;
		let lastDrawTime = performance.now() - fpsInterval;
		function sendPrompt() {
			const now = performance.now();
			const elapsed = now - lastDrawTime;

			if (elapsed > fpsInterval) {
				lastDrawTime = now - (elapsed % fpsInterval);
				if (receivedReference.current && started) {
					receivedReference.current = false;
					send({
						action: "comfyui:queue",
						payload: {
							workflow: createWorkflow({
								prompt: injectPrompt(
									prompt,
									illustrationStyles[illustrationStyle].positive
								),
								seed,
							}),
						},
					});
				}
			}

			animationFrame = requestAnimationFrame(sendPrompt);
		}

		animationFrame = requestAnimationFrame(sendPrompt);
		return () => {
			cancelAnimationFrame(animationFrame);
		};
	}, [illustrationStyle, prompt, seed, send, started]);

	useComfyUIPath();

	return (
		<Box sx={{ display: "flex", flexDirection: "column", minHeight: "100%" }}>
			<RequiredModelsAlert downloads={allRequiredDownloads} />
			<StyledStickyHeader>
				{/* Left Side of the header */}
				<StyledButtonWrapper>
					{started ? (
						<Button
							color="red"
							startDecorator={
								isGenerating ? <CircularProgress color="red" /> : <StopIcon />
							}
							onClick={() => {
								startedReference.current = false;
								setIsGenerating(false);
								setStarted(false);
							}}
						>
							{t("labels:stop")}
						</Button>
					) : (
						<Button
							color="green"
							startDecorator={
								isGenerating ? (
									<CircularProgress color="green" />
								) : (
									<PlayArrowIcon />
								)
							}
							onClick={() => {
								startedReference.current = true;
								setIsGenerating(true);
								setStarted(true);
								send({
									action: "comfyui:queue",
									payload: {
										workflow: createWorkflow({
											prompt: injectPrompt(
												prompt,
												illustrationStyles[illustrationStyle].positive
											),
											seed,
										}),
									},
								});
							}}
						>
							{t("labels:start")}
						</Button>
					)}
					{/* Switch to toggle the overlay layout mode */}
					<Switch
						checked={isOverlay}
						startDecorator={<Typography>{t("labels:overlay")}</Typography>}
						onChange={_event => {
							setIsOverlay(_event.target.checked);
						}}
					/>
					<Box sx={theme => ({ width: theme.spacing(1) })} />
					{/* Select the painting color */}
					<ColorInputButton
						label={t("labels:color")}
						value={livePaintingOptions.color}
						onChange={event => {
							setLivePaintingOptions(previousState => ({
								...previousState,
								color: event.target.value,
							}));
						}}
					/>
					{/* Select the size of the brush */}
					<PopupSlider
						label={t("labels:brushSize")}
						min={3}
						max={100}
						step={1}
						value={livePaintingOptions.brushSize}
						onChange={(event, value) => {
							setLivePaintingOptions(previousState => ({
								...previousState,
								brushSize: value as number,
							}));
						}}
					>
						<BrushIcon />
					</PopupSlider>
					<Box sx={{ flex: 1 }} />
					{/* Get a new random seed to allow a new generation */}
					<TooltipButton
						label={t("labels:randomize")}
						onClick={() => {
							setSeed(randomSeed());
						}}
					>
						<CasinoIcon />
					</TooltipButton>
					{/* Clear the drawing canvas */}
					<TooltipButton
						label={t("labels:clear")}
						onClick={() => {
							setClearCounter(previousState => previousState + 1);
						}}
					>
						<ClearIcon />
					</TooltipButton>
				</StyledButtonWrapper>
				{/* Right Side of the header */}
				<StyledButtonWrapper>
					<Box sx={{ flex: 1 }} />
					{/* Save the image to disk (includes a control + s listener) */}
					<SaveButton image={image} prompt={prompt} fileName={fileName} />
				</StyledButtonWrapper>
			</StyledStickyHeader>
			{/* Main Area includes the drawing and rendering area */}
			<Sheet
				sx={{
					flex: 1,
					display: "flex",
					flexWrap: "wrap",
					py: 2,
					position: "relative",
					justifyContent: "center",
				}}
			>
				<StyledDrawingAreaWrapper
					sx={{
						width: {
							xs: "100%",
							md: isOverlay ? "100%" : "50%",
						},
						position: isOverlay ? "absolute" : "relative",
					}}
				>
					<DrawingArea isOverlay={isOverlay} />
				</StyledDrawingAreaWrapper>
				<StyledRenderingAreaWrapper
					sx={{
						width: {
							xs: "100%",
							md: isOverlay ? "100%" : "50%",
						},
						flex: isOverlay ? 1 : undefined,
					}}
				>
					<RenderingArea image={image} height={512} width={512} />
				</StyledRenderingAreaWrapper>
			</Sheet>
			{/* The prompt to be used for generations (includes a selector for illustration styles for convenience) */}
			<PromptSheet
				illustrationStyle={illustrationStyle}
				prompt={prompt}
				onIllustrationStyleChange={value => {
					setIllustrationStyle(value);
				}}
				onPromptChange={value => {
					setPrompt(value);
				}}
			/>
		</Box>
	);
}
