import { useSDK } from "@captn/react/use-sdk";
import BrushIcon from "@mui/icons-material/Brush";
import CasinoIcon from "@mui/icons-material/Casino";
import ClearIcon from "@mui/icons-material/Clear";
import Box from "@mui/joy/Box";
import Sheet from "@mui/joy/Sheet";
import Switch from "@mui/joy/Switch";
import Typography from "@mui/joy/Typography";
import { useAtom } from "jotai";
import { useTranslation } from "next-i18next";
import { useEffect, useState } from "react";

import { clearCounterAtom, imageAtom, livePaintingOptionsAtom } from "./atoms";
import {
	ColorInputButton,
	PopupSlider,
	PromptSheet,
	RunButton,
	SaveButton,
	TooltipButton,
} from "./components";
import { allRequiredDownloads, APP_ID } from "./constants";
import { DrawingArea } from "./drawing-area";
import { useUnload } from "./hooks";
import { RenderingArea } from "./rendering-area";
import {
	StyledButtonWrapper,
	StyledDrawingAreaWrapper,
	StyledRenderingAreaWrapper,
	StyledStickyHeader,
} from "./styled";
import type { IllustrationStyles } from "./text-to-image";
import { illustrationStyles } from "./text-to-image";

import { randomSeed } from "#/number";
import { RequiredModelsAlert } from "@/apps/live-painting/required-models-alert";

export function LivePainting() {
	const { t } = useTranslation(["common", "labels"]);

	// Local States
	const [isOverlay, setIsOverlay] = useState(false);
	const [prompt, setPrompt] = useState("");
	const [illustrationStyle, setIllustrationStyle] = useState<IllustrationStyles>("childrensBook");
	const [seed, setSeed] = useState(randomSeed());
	const [isRunning, setIsRunning] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	// Global States
	const [livePaintingOptions, setLivePaintingOptions] = useAtom(livePaintingOptionsAtom);
	const [image] = useAtom(imageAtom);
	const [, setClearCounter] = useAtom(clearCounterAtom);

	const { send } = useSDK<unknown, string>(APP_ID, {
		onMessage(message) {
			switch (message.action) {
				case "image-to-image:started": {
					setIsRunning(true);
					setIsLoading(false);
					break;
				}

				case "image-to-image:stopped": {
					setIsRunning(false);
					setIsLoading(false);
					break;
				}

				default: {
					break;
				}
			}
		},
	});

	useUnload();

	useEffect(() => {
		if (isRunning) {
			send({
				action: "image-to-image:settings",
				payload: {
					prompt: [prompt, illustrationStyles[illustrationStyle]].join(", "),
					seed,
				},
			});
		}
	}, [send, prompt, seed, isRunning, illustrationStyle]);

	return (
		<Box sx={{ display: "flex", flexDirection: "column", minHeight: "100%" }}>
			<RequiredModelsAlert downloads={allRequiredDownloads} />
			<StyledStickyHeader>
				{/* Left Side of the header */}
				<StyledButtonWrapper>
					{/* Button to start and stop the live painting process */}
					<RunButton
						isLoading={isLoading}
						isRunning={isRunning}
						onStop={() => {
							setIsLoading(true);
							send({ action: "image-to-image:stop", payload: APP_ID });
						}}
						onStart={() => {
							setIsLoading(true);
							send({
								action: "image-to-image:start",
								payload: {
									appId: APP_ID,
									stablefast: true,
									model: "stabilityai/sd-turbo/fp16",
									vae: "madebyollin/taesd",
								},
							});
						}}
					/>
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
					<SaveButton
						image={image}
						prompt={[prompt, illustrationStyles[illustrationStyle]].join(", ")}
					/>
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
					<RenderingArea />
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
