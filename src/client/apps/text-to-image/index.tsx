import { useSDK } from "@captn/react/use-sdk";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import Box from "@mui/joy/Box";
import Button from "@mui/joy/Button";
import CircularProgress from "@mui/joy/CircularProgress";
import Sheet from "@mui/joy/Sheet";
import { useAtom } from "jotai";
import { useTranslation } from "next-i18next";
import { useState } from "react";

import { imageAtom } from "./atoms";
import { allRequiredDownloads, APP_ID } from "./constants";
import { useUnload } from "./hooks";
import { RenderingArea } from "./rendering-area";

import { randomSeed } from "#/number";
import { PromptSheet, RunButton, SaveButton } from "@/apps/live-painting/components";
import { RequiredModelsAlert } from "@/apps/live-painting/required-models-alert";
import {
	StyledButtonWrapper,
	StyledRenderingAreaWrapper,
	StyledStickyHeader,
} from "@/apps/live-painting/styled";
import type { IllustrationStyles } from "@/apps/live-painting/text-to-image";
import { illustrationStyles } from "@/apps/live-painting/text-to-image";

export function TextToImage() {
	const { t } = useTranslation(["common", "labels"]);

	// Local States
	const [prompt, setPrompt] = useState("");
	const [illustrationStyle, setIllustrationStyle] = useState<IllustrationStyles>("childrensBook");
	const [isRunning, setIsRunning] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [isGenerating, setIsGenerating] = useState(false);

	// Global States
	const [image] = useAtom(imageAtom);

	const { send } = useSDK<unknown, string>(APP_ID, {
		onMessage(message) {
			switch (message.action) {
				case "text-to-image:started": {
					setIsRunning(true);
					setIsLoading(false);
					break;
				}

				case "text-to-image:stopped": {
					setIsRunning(false);
					setIsLoading(false);
					break;
				}

				case "text-to-image:generated": {
					setIsGenerating(false);
					break;
				}

				default: {
					break;
				}
			}
		},
	});

	useUnload();

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
							send({ action: "text-to-image:stop", payload: APP_ID });
						}}
						onStart={() => {
							setIsLoading(true);
							send({
								action: "text-to-image:start",
								payload: {
									appId: APP_ID,
									model: "stabilityai/sdxl/sd_xl_base_1.0_0.9vae.safetensors",
									vae: "madebyollin/taesdxl",
								},
							});
						}}
					/>
				</StyledButtonWrapper>
				{/* Right Side of the header */}
				<StyledButtonWrapper>
					<Box sx={{ flex: 1 }} />
					<Button
						disabled={isGenerating}
						startDecorator={isGenerating ? <CircularProgress /> : <PlayArrowIcon />}
						onClick={() => {
							if (isRunning) {
								setIsGenerating(true);
								send({
									action: "text-to-image:settings",
									payload: {
										prompt: [
											prompt,
											illustrationStyles[illustrationStyle],
										].join(", "),
										seed: randomSeed(),
									},
								});
							}
						}}
					>
						{t("labels:generate")}
					</Button>
					{/* Save the image to disk (includes a control + s listener) */}
					<SaveButton
						image={image}
						prompt={[prompt, illustrationStyles[illustrationStyle]].join(", ")}
					/>
				</StyledButtonWrapper>
			</StyledStickyHeader>
			<Sheet
				sx={{
					flex: 1,
					display: "flex",
					py: 2,
					position: "relative",
					justifyContent: "center",
				}}
			>
				<StyledRenderingAreaWrapper
					sx={{
						width: {
							xs: "100%",
							md: "100%",
						},
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
