import { useSDK } from "@captn/react/use-sdk";
import { useUnload } from "@captn/react/use-unload";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import Box from "@mui/joy/Box";
import Button from "@mui/joy/Button";
import CircularProgress from "@mui/joy/CircularProgress";
import Sheet from "@mui/joy/Sheet";
import { useAtom } from "jotai";
import { useTranslation } from "next-i18next";
import { useEffect, useState } from "react";

import { imageAtom } from "./atoms";
import { allRequiredDownloads } from "./constants";
import { RenderingArea } from "./rendering-area";

import { PromptSheet } from "@/client/apps/live-painting/components";
import { RequiredModelsAlert } from "@/client/apps/live-painting/required-models-alert";
import {
	StyledButtonWrapper,
	StyledRenderingAreaWrapper,
	StyledStickyHeader,
} from "@/client/apps/live-painting/styled";
import type { IllustrationStyles } from "@/client/apps/live-painting/text-to-image";
import { illustrationStyles } from "@/client/apps/live-painting/text-to-image";
import { createWorkflow } from "@/client/apps/text-to-image/create-workflow";
import { comfyUITemporaryPathAtom } from "@/client/ions/atoms";
import { useComfyUIPath } from "@/client/ions/hooks/comfyui-path";
import { buildKey } from "@/shared/build-key";
import { ID } from "@/shared/enums";
import { randomSeed } from "@/shared/number";

interface ComfyUIExecuted {
	type: "executed";
	data: {
		output: {
			images: { filename: string; subfolder: string }[];
		};
	};
}

const APP_ID = "text-to-image";

export function TextToImage() {
	const { t } = useTranslation(["common", "labels"]);

	// Local States
	const [prompt, setPrompt] = useState("");
	const [illustrationStyle, setIllustrationStyle] = useState<IllustrationStyles>("childrensBook");
	const [isGenerating, setIsGenerating] = useState(false);

	// Global States
	const [, setImage] = useAtom(imageAtom);
	const [comfyUITemporaryPath] = useAtom(comfyUITemporaryPathAtom);

	const { send } = useSDK<unknown, object>(APP_ID, {
		onMessage(message) {
			switch (message.action) {
				case "comfyui:update": {
					const { data } = message.payload as {
						data: ComfyUIExecuted;
					};

					if (data.type === "executed") {
						const { filename, subfolder } = data.data.output.images[0];
						const temporaryImage =
							`${comfyUITemporaryPath}/${subfolder}/${filename}`.replaceAll(
								/\?+/g,
								"/"
							);
						setImage(temporaryImage);
						window.ipc.send(
							buildKey([ID.FILE], { suffix: ":copy-image-with-metadata" }),
							{
								source: temporaryImage,
								destination: `images/${filename}`,
								metadata: { description: prompt },
							}
						);
						setIsGenerating(false);
					}

					break;
				}

				default: {
					break;
				}
			}
		},
	});

	useEffect(() => {
		send({
			action: "comfyui:registerClient",
			payload: {},
		});
	}, [send]);

	useUnload(APP_ID, "comfyui:free", {
		unloadModels: true,
		freeMemory: false,
	});

	useComfyUIPath();

	return (
		<Box sx={{ display: "flex", flexDirection: "column", minHeight: "100%" }}>
			<RequiredModelsAlert downloads={allRequiredDownloads} />
			<StyledStickyHeader>
				{/* Left Side of the header */}
				<StyledButtonWrapper>
					<Button
						disabled={isGenerating}
						startDecorator={isGenerating ? <CircularProgress /> : <PlayArrowIcon />}
						onClick={() => {
							setIsGenerating(true);
							send({
								action: "comfyui:queue",
								payload: {
									workflow: createWorkflow({
										prompt: [
											prompt,
											illustrationStyles[illustrationStyle],
										].join(", "),
										seed: randomSeed(),
									}),
								},
							});
						}}
					>
						{t("labels:generate")}
					</Button>
				</StyledButtonWrapper>
				{/* Right Side of the header */}
				<StyledButtonWrapper />
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
