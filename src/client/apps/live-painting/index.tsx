import { useResettableState } from "@captn/react/use-resettable-state";
import { useSDK } from "@captn/react/use-sdk";
import { useUnload } from "@captn/react/use-unload";
import BrushIcon from "@mui/icons-material/Brush";
import CasinoIcon from "@mui/icons-material/Casino";
import CheckIcon from "@mui/icons-material/Check";
import ClearIcon from "@mui/icons-material/Clear";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PlaylistAddIcon from "@mui/icons-material/PlaylistAdd";
import SaveIcon from "@mui/icons-material/Save";
import StopIcon from "@mui/icons-material/Stop";
import Badge from "@mui/joy/Badge";
import Box from "@mui/joy/Box";
import Button from "@mui/joy/Button";
import CircularProgress from "@mui/joy/CircularProgress";
import Option from "@mui/joy/Option";
import Select from "@mui/joy/Select";
import Sheet from "@mui/joy/Sheet";
import Switch from "@mui/joy/Switch";
import Typography from "@mui/joy/Typography";
import { useAtom } from "jotai";
import { useTranslation } from "next-i18next";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
	clearCounterAtom,
	imageAtom,
	livePaintingOptionsAtom,
	selectedCheckpointAtom,
} from "./atoms";
import { allRequiredDownloads, APP_ID, FRAMES_PER_SECOND, MAX_QUEUE_LENGTH } from "./constants";
import { createWorkflow } from "./create-workflow";
import { DrawingArea } from "./drawing-area";

import {
	ColorInputButton,
	PopupRadiusSlider,
	PopupSlider,
	PromptSheet,
	TooltipButton,
} from "@/client/apps/shared/components";
import type { StableDiffusion } from "@/client/apps/shared/hooks";
import { useInventory } from "@/client/apps/shared/hooks";
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
import { TimerIcon } from "@/client/atoms/icons/custom";
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
			window.ipc.copyFileWithMetadata({
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
	const [cfg, setCfg] = useState(1);
	const [steps, setSteps] = useState(1);
	const [fileName, setFileName] = useState("");
	const startedReference = useRef(false);
	const [started, setStarted] = useState(false);
	const [isGenerating, setIsGenerating] = useState(false);

	const { data } = useInventory<StableDiffusion>("stable-diffusion");

	// Global States
	const [livePaintingOptions, setLivePaintingOptions] = useAtom(livePaintingOptionsAtom);
	const [image, setImage] = useAtom(imageAtom);
	const [, setClearCounter] = useAtom(clearCounterAtom);
	const receivedReference = useRef(false);
	const [selectedCheckpoint, setSelectedCheckpoint] = useAtom(selectedCheckpointAtom);

	const { send } = useSDK<unknown, unknown>(APP_ID, {
		onMessage(message) {
			switch (message.action) {
				case "comfyui:update": {
					const { data, comfyUITemporaryPath } = message.payload as {
						data: ComfyExecuted | ComfyExecuting | ComfyCached | ComfyStatusMessage;
						comfyUITemporaryPath: string;
					};
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

	const checkpoints = useMemo(() => {
		if (data?.checkpoints) {
			return data?.checkpoints.filter(checkpoint =>
				checkpoint.label.toLowerCase().includes("turbo")
			);
		}

		return [];
	}, [data]);

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

			if (elapsed > fpsInterval && selectedCheckpoint) {
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
								steps,
								cfg,
								// Set the lora and ensure the required backward slashes for windows.
								// TODO handle macOS and Linux
								checkpointName: selectedCheckpoint.replaceAll("/", "\\"),
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
	}, [selectedCheckpoint, illustrationStyle, prompt, seed, send, started, cfg, steps]);

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
							disabled={!selectedCheckpoint}
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
					<PopupRadiusSlider
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
					</PopupRadiusSlider>
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
					<Badge badgeContent={cfg} variant="outlined" color="lime" size="sm">
						<PopupSlider
							label={t("labels:promptStrength")}
							variant="soft"
							color="lime"
							valueLabelDisplay="on"
							value={cfg}
							min={0}
							max={3}
							step={0.25}
							width={300}
							onChange={(_, value) => {
								setCfg(value as number);
							}}
						>
							<PlaylistAddIcon />
						</PopupSlider>
					</Badge>
					<Badge badgeContent={steps} variant="outlined" color="green" size="sm">
						<PopupSlider
							label={t("labels:steps")}
							variant="soft"
							color="green"
							valueLabelDisplay="on"
							value={steps}
							min={1}
							max={8}
							step={1}
							width={300}
							onChange={(_, value) => {
								setSteps(value as number);
							}}
						>
							<TimerIcon />
						</PopupSlider>
					</Badge>
					<Box component="label" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
						<Typography>Checkpoint</Typography>
						<Select
							value={selectedCheckpoint}
							sx={{ width: 200 }}
							onChange={(_event, value) => {
								if (value) {
									setSelectedCheckpoint(value);
								}
							}}
						>
							{checkpoints.map(checkpoint => (
								<Option key={checkpoint.id} value={checkpoint.filePath}>
									{checkpoint.label}
								</Option>
							))}
						</Select>
					</Box>

					<Box sx={{ flex: 1 }} />
					{/* Save the image to disk (includes a control + s listener) */}
					<SaveButton image={image} prompt={prompt} fileName={fileName} />
				</StyledButtonWrapper>
			</StyledStickyHeader>
			{/* Main Area includes the drawing and rendering area */}
			<Sheet
				sx={{
					flex: 1,
					minHeight: "100%",
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
