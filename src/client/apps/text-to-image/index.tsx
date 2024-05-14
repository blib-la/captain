import { useSDK } from "@captn/react/use-sdk";
import { useUnload } from "@captn/react/use-unload";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PlaylistAddIcon from "@mui/icons-material/PlaylistAdd";
import Badge from "@mui/joy/Badge";
import Box from "@mui/joy/Box";
import Button from "@mui/joy/Button";
import ButtonGroup from "@mui/joy/ButtonGroup";
import Chip from "@mui/joy/Chip";
import CircularProgress from "@mui/joy/CircularProgress";
import Sheet from "@mui/joy/Sheet";
import Stack from "@mui/joy/Stack";
import Switch from "@mui/joy/Switch";
import Tooltip from "@mui/joy/Tooltip";
import { useAtom } from "jotai";
import { useTranslation } from "next-i18next";
import { useEffect, useState } from "react";

import { imageAtom } from "./atoms";
import { allRequiredDownloads, APP_ID } from "./constants";
import { createWorkflow } from "./create-workflow";

import {
	PopupButton,
	PopupSlider,
	PromptSheet,
	SeedField,
	SizeSelector,
} from "@/client/apps/shared/components";
import { sizes } from "@/client/apps/shared/constants";
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
import { SizeIcon, TimerIcon } from "@/client/atoms/icons/custom";
import { comfyUITemporaryPathAtom } from "@/client/ions/atoms";
import { useComfyUIPath } from "@/client/ions/hooks/comfyui-path";
import { buildKey } from "@/shared/build-key";
import { ID } from "@/shared/enums";
import { randomSeed } from "@/shared/number";

export function TextToImage() {
	const { t } = useTranslation(["common", "labels"]);

	// Local States
	const [prompt, setPrompt] = useState("");
	const [negativePrompt, setNegativePrompt] = useState("");
	const [size, setSize] = useState(sizes[4]);
	const [cfg, setCfg] = useState(7.5);
	const [steps, setSteps] = useState(30);
	const [enableLora, setEnableLora] = useState(false);
	const [lastSeed, setLastSeed] = useState(randomSeed());
	const [seed, setSeed] = useState(-1);
	const [queueSize, setQueueSize] = useState(0);
	const [illustrationStyle, setIllustrationStyle] = useState<IllustrationStyles>("childrensBook");
	const [isGenerating, setIsGenerating] = useState(false);

	// Global States
	const [image, setImage] = useAtom(imageAtom);
	const [comfyUITemporaryPath] = useAtom(comfyUITemporaryPathAtom);

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
			<StyledStickyHeader sx={{ py: 1 }}>
				{/* Left Side of the header */}
				<StyledButtonWrapper>
					<ButtonGroup variant="solid">
						<Badge
							badgeContent={queueSize}
							color="grey"
							variant="soft"
							slotProps={{
								badge: { sx: theme => ({ zIndex: theme.zIndex.tooltip }) },
							}}
						>
							<Button
								//
								// disabled={isGenerating}
								color={size.color}
								startDecorator={
									isGenerating ? <CircularProgress /> : <PlayArrowIcon />
								}
								onClick={() => {
									setIsGenerating(true);

									// The seed needs to be stored, so we can allow using the last random seed.
									const usedSeed = seed < 0 ? randomSeed() : seed;
									setLastSeed(usedSeed);

									send({
										action: "comfyui:queue",
										payload: {
											workflow: createWorkflow({
												height: size.height,
												width: size.width,
												cfg,
												steps,
												prompt: injectPrompt(
													prompt,
													illustrationStyles[illustrationStyle].positive
												),
												negativePrompt: injectPrompt(
													negativePrompt,
													illustrationStyles[illustrationStyle].negative
												),
												seed: usedSeed,
												loraName: enableLora
													? "blib-la\\blibla_style_lora_sdxl\\blibla_styles_sdxl.safetensors"
													: undefined,
											}),
										},
									});
								}}
							>
								{t("labels:generate")}{" "}
								<Chip
									variant="outlined"
									color={size.color}
									sx={{ ml: 1, minWidth: 100 }}
								>
									{size.width}x{size.height}
								</Chip>
							</Button>
						</Badge>
						<PopupButton
							variant="soft"
							color={size.color}
							label={t("labels:size")}
							icon={<SizeIcon />}
						>
							<SizeSelector
								sizes={sizes}
								value={size}
								selectLabel={t("labels:size")}
								onChange={size_ => {
									setSize(size_);
								}}
							/>
						</PopupButton>
					</ButtonGroup>
					<Box sx={{ flex: 1 }} />
					<SeedField
						value={seed}
						lastSeed={lastSeed}
						label={t("labels:seed")}
						fixedLabel={t("labels:setFixedSeed")}
						randomLabel={t("labels:setRandomSeed")}
						onChange={seed_ => {
							setSeed(seed_);
						}}
					/>
				</StyledButtonWrapper>
				<StyledButtonWrapper>
					{/* Right Side of the header */}

					<Badge badgeContent={cfg} variant="outlined" color="lime" size="sm">
						<PopupSlider
							label={t("labels:promptStrength")}
							variant="soft"
							color="lime"
							valueLabelDisplay="on"
							value={cfg}
							min={0}
							max={15}
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
							max={50}
							step={1}
							width={300}
							onChange={(_, value) => {
								setSteps(value as number);
							}}
						>
							<TimerIcon />
						</PopupSlider>
					</Badge>

					<Tooltip title="LoRA">
						<Switch
							startDecorator={<AutoFixHighIcon />}
							checked={enableLora}
							onChange={event => {
								setEnableLora(event.target.checked);
							}}
						/>
					</Tooltip>
					<Box sx={{ flex: 1 }} />
				</StyledButtonWrapper>
			</StyledStickyHeader>
			<Stack sx={{ flex: 1, flexDirection: { lg: "row-reverse" } }}>
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
						<RenderingArea zoomImage image={image} />
					</StyledRenderingAreaWrapper>
				</Sheet>
				{/* The prompt to be used for generations (includes a selector for illustration styles for convenience) */}
				<PromptSheet
					flexDirection={{ xs: "column", md: "row", lg: "column" }}
					illustrationStyle={illustrationStyle}
					prompt={prompt}
					negativePrompt={negativePrompt}
					onIllustrationStyleChange={value => {
						setIllustrationStyle(value);
					}}
					onPromptChange={value => {
						setPrompt(value);
					}}
					onNegativePromptChange={value => {
						setNegativePrompt(value);
					}}
				/>
			</Stack>
		</Box>
	);
}
