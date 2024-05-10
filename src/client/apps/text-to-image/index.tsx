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
import { allRequiredDownloads, APP_ID } from "./constants";
import { createWorkflow } from "./create-workflow";

import { PromptSheet } from "@/client/apps/shared/components";
import type { IllustrationStyles } from "@/client/apps/shared/illustration-styles";
import { illustrationStyles, injectPrompt } from "@/client/apps/shared/illustration-styles";
import { RenderingArea } from "@/client/apps/shared/rendering-area";
import { RequiredModelsAlert } from "@/client/apps/shared/required-models-alert";
import {
	StyledButtonWrapper,
	StyledRenderingAreaWrapper,
	StyledStickyHeader,
} from "@/client/apps/shared/styled";
import type { ComfyExecuted, ComfyStatusMessage } from "@/client/apps/shared/types";
import { comfyUITemporaryPathAtom } from "@/client/ions/atoms";
import { useComfyUIPath } from "@/client/ions/hooks/comfyui-path";
import { buildKey } from "@/shared/build-key";
import { ID } from "@/shared/enums";
import { randomSeed } from "@/shared/number";

const sizes = [
	{ height: 1536, width: 644 },
	{ height: 1344, width: 768 },
	{ height: 1216, width: 832 },
	{ height: 1152, width: 896 },
	{ height: 1024, width: 1024 },
	{ height: 896, width: 1152 },
	{ height: 832, width: 1216 },
	{ height: 768, width: 1344 },
	{ height: 644, width: 1536 },
];

export function TextToImage() {
	const { t } = useTranslation(["common", "labels"]);

	// Local States
	const [prompt, setPrompt] = useState("");
	const [illustrationStyle, setIllustrationStyle] = useState<IllustrationStyles>("childrensBook");
	const [isGenerating, setIsGenerating] = useState(false);

	// Global States
	const [image, setImage] = useAtom(imageAtom);
	const [comfyUITemporaryPath] = useAtom(comfyUITemporaryPathAtom);
	const [size] = useState(sizes[3]);
	const [queueSize, setQueueSize] = useState(0);

	const { send } = useSDK<unknown, object>(APP_ID, {
		onMessage(message) {
			switch (message.action) {
				case "comfyui:update": {
					const { data } = message.payload as {
						data: ComfyExecuted | ComfyStatusMessage;
					};
					if (data.type === "status") {
						setQueueSize(data.data.status.exec_info.queue_remaining);
						setIsGenerating(data.data.status.exec_info.queue_remaining > 0);
					} else if (data.type === "executed") {
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
	useComfyUIPath();

	return (
		<Box sx={{ display: "flex", flexDirection: "column", minHeight: "100%" }}>
			<RequiredModelsAlert downloads={allRequiredDownloads} />
			<StyledStickyHeader>
				{/* Left Side of the header */}
				<StyledButtonWrapper>
					<Button
						//
						// disabled={isGenerating}
						startDecorator={isGenerating ? <CircularProgress /> : <PlayArrowIcon />}
						onClick={() => {
							setIsGenerating(true);
							send({
								action: "comfyui:queue",
								payload: {
									workflow: createWorkflow({
										height: size.height,
										width: size.width,
										cfg: 8.5,
										steps: 35,
										prompt: injectPrompt(
											prompt,
											illustrationStyles[illustrationStyle].positive
										),
										negativePrompt:
											illustrationStyles[illustrationStyle].negative,
										seed: randomSeed(),
									}),
								},
							});
						}}
					>
						{t("labels:generate")} {Boolean(queueSize) && `(${queueSize})`}
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
						position: "absolute",
						inset: 0,
						width: {
							xs: "100%",
							md: "100%",
						},
					}}
				>
					<RenderingArea image={image} height={size.height} width={size.width} />
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
