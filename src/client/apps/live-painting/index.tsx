import { useSDK } from "@captn/react/use-sdk";
import { ClickAwayListener } from "@mui/base";
import BrushIcon from "@mui/icons-material/Brush";
import CasinoIcon from "@mui/icons-material/Casino";
import CheckIcon from "@mui/icons-material/Check";
import ClearIcon from "@mui/icons-material/Clear";
import DownloadIcon from "@mui/icons-material/Download";
import PaletteIcon from "@mui/icons-material/Palette";
import PlayIcon from "@mui/icons-material/PlayArrow";
import SaveIcon from "@mui/icons-material/Save";
import StopIcon from "@mui/icons-material/Stop";
import Box from "@mui/joy/Box";
import Button from "@mui/joy/Button";
import CircularProgress from "@mui/joy/CircularProgress";
import FormControl from "@mui/joy/FormControl";
import FormLabel from "@mui/joy/FormLabel";
import IconButton from "@mui/joy/IconButton";
import Option from "@mui/joy/Option";
import Select from "@mui/joy/Select";
import Sheet from "@mui/joy/Sheet";
import Slider from "@mui/joy/Slider";
import Switch from "@mui/joy/Switch";
import Textarea from "@mui/joy/Textarea";
import Tooltip from "@mui/joy/Tooltip";
import Typography from "@mui/joy/Typography";
import { useAtom } from "jotai";
import { useTranslation } from "next-i18next";
import { useCallback, useEffect, useState } from "react";
import { v4 } from "uuid";

import { clearCounterAtom, imageAtom, livePaintingOptionsAtom } from "./atoms";
import { DrawingArea } from "./drawing-area";
import { RenderingArea } from "./rendering-area";
import type { IllustrationStyles } from "./text-to-image";
import { illustrationStyles } from "./text-to-image";

import { randomSeed } from "#/number";
import type { Repository } from "#/types";
import { APP_ID } from "@/apps/live-painting/constants";
import { FlagUs } from "@/atoms/flags/us";
import { useResettableState } from "@/ions/hooks/resettable-state";
import { getContrastColor } from "@/ions/utils/color";

export function LivePainting() {
	const { t } = useTranslation(["common", "labels"]);
	const [isOverlay, setIsOverlay] = useState(false);
	const [livePaintingOptions, setLivePaintingOptions] = useAtom(livePaintingOptionsAtom);
	const [, setClearCounter] = useAtom(clearCounterAtom);
	const [brushSizeOpen, setBrushSizeOpen] = useState(false);
	const [prompt, setPrompt] = useState("");
	const [illustrationStyle, setIllustrationStyle] = useState<IllustrationStyles>("childrensBook");
	const [settings, setSettings] = useState({
		seed: randomSeed(),
		strength: 0.95,
		steps: 3,
		guidance_scale: 1,
	});
	const [modelSettings, setModelSettings] = useState({
		id: "sd-turbo",
		model_type: "stable-diffusion",
		model_path: "stabilityai/sd-turbo",
		vae_path: "madebyollin/taesd",
	});
	const [image] = useAtom(imageAtom);
	const [running, setRunning] = useState(false);
	const [shouldRestart, setShouldRestart] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [saved, setSaved] = useResettableState(false, 3000);

	const [checkpoints, setCheckpoints] = useState<Repository[]>([]);
	const [vae, setVae] = useState<Repository[]>([]);
	const [isDownloading, setIsDownloading] = useState(false);
	const hasModelAndVae = checkpoints.length > 0 && vae.length > 0;

	const { send, writeFile } = useSDK<unknown, string>(APP_ID, {
		onMessage(message) {
			console.log(message);
			switch (message.action) {
				case "livePainting:started": {
					setRunning(true);
					setIsLoading(false);
					break;
				}

				case "livePainting:stopped": {
					setRunning(false);
					setIsLoading(false);
					break;
				}

				default: {
					break;
				}
			}
		},
	});

	const saveImage = useCallback(async () => {
		const id = v4();
		await writeFile(`images/${id}.png`, image.split(";base64,").pop()!, {
			encoding: "base64",
		});
		setSaved(true);
	}, [image, writeFile, setSaved]);

	useEffect(() => {
		window.ipc.inventoryStore
			.get<Repository[]>("stable-diffusion.checkpoints", [])
			.then(checkpoints => {
				setCheckpoints(checkpoints);
			});

		window.ipc.inventoryStore.get<Repository[]>("stable-diffusion.vae", []).then(vae => {
			setVae(vae);
		});

		const unsubscribeCheckpoints = window.ipc.on(
			"stable-diffusion.checkpoints",
			checkpoints => {
				setCheckpoints(checkpoints);
			}
		);

		const unsubscribeVae = window.ipc.on("stable-diffusion.vae", vae => {
			setVae(vae);
		});
		return () => {
			unsubscribeCheckpoints();
			unsubscribeVae();
		};
	}, []);

	useEffect(() => {
		if (hasModelAndVae) {
			setIsDownloading(false);
		}
	}, [hasModelAndVae]);

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

	useEffect(() => {
		if (running) {
			send({
				action: "livePainting:settings",
				payload: {
					prompt: [prompt, illustrationStyles[illustrationStyle]].join(", "),
					...settings,
					// Attempted model switch
					// model_type: modelSettings.model_type,
					// model_path: modelSettings.model_path,
					// vae_path: modelSettings.vae_path,
				},
			});
		}
	}, [send, prompt, settings, running, illustrationStyle]);

	useEffect(() => {
		if (shouldRestart) {
			setIsLoading(true);
			send({ action: "livePainting:start", payload: modelSettings });
		}
	}, [shouldRestart, send, modelSettings]);

	useEffect(() => {
		function beforeUnload() {
			send({ action: "livePainting:stop", payload: APP_ID });
		}

		window.addEventListener("beforeunload", beforeUnload);
		return () => {
			window.removeEventListener("beforeunload", beforeUnload);
		};
	}, [send]);

	return (
		<Box sx={{ display: "flex", flexDirection: "column", minHeight: "100%" }}>
			<Sheet
				sx={{
					position: "sticky",
					top: 0,
					zIndex: 2,
					display: "flex",
					flexWrap: "wrap",
					alignItems: "center",
					flexShrink: 0,
				}}
			>
				<Box
					sx={{
						display: "flex",
						gap: 1,
						flex: 1,
						px: 1,
						height: 44,
						alignItems: "center",
					}}
				>
					{running ? (
						<Button
							disabled={isLoading}
							color="danger"
							variant="soft"
							startDecorator={isLoading ? <CircularProgress /> : <StopIcon />}
							onClick={() => {
								setIsLoading(true);
								send({ action: "livePainting:stop", payload: APP_ID });
							}}
						>
							{t("labels:stop")}
						</Button>
					) : (
						<Button
							disabled={isLoading || !hasModelAndVae}
							color="success"
							variant="soft"
							startDecorator={isLoading ? <CircularProgress /> : <PlayIcon />}
							onClick={() => {
								setIsLoading(true);
								send({ action: "livePainting:start", payload: modelSettings });
							}}
						>
							{t("labels:start")}
						</Button>
					)}
					<Switch
						checked={isOverlay}
						component="div"
						startDecorator={<Typography>{t("labels:overlay")}</Typography>}
						onChange={_event => {
							setIsOverlay(_event.target.checked);
						}}
					/>
					<Box sx={{ width: 8 }} />
					<Tooltip title={t("labels:color")}>
						<IconButton
							component="label"
							size="md"
							tabIndex={-1}
							aria-label={t("labels:color")}
							sx={{
								"--Icon-color": "currentColor",
								overflow: "hidden",
							}}
							style={{
								backgroundColor: livePaintingOptions.color,
								color: getContrastColor(livePaintingOptions.color),
							}}
						>
							<input
								type="color"
								value={livePaintingOptions.color}
								style={{
									width: "100%",
									height: "100%",
									minWidth: 0,
									opacity: 0,
									position: "absolute",
									inset: 0,
									cursor: "pointer",
								}}
								onChange={event => {
									setLivePaintingOptions(previousState => ({
										...previousState,
										color: event.target.value,
									}));
								}}
							/>
							<PaletteIcon />
						</IconButton>
					</Tooltip>
					<Tooltip
						disableInteractive={false}
						open={brushSizeOpen}
						variant="soft"
						sx={{ p: 0 }}
						placement="bottom-start"
						title={
							<ClickAwayListener
								onClickAway={() => {
									setBrushSizeOpen(false);
								}}
							>
								<Box
									sx={{ display: "flex", width: 300, px: 2, py: 1, gap: 2 }}
									onMouseLeave={() => {
										setBrushSizeOpen(false);
									}}
								>
									<Box
										sx={{
											bgcolor: "background.body",
											color: "text.primary",
											height: 108,
											width: 108,
											flexShrink: 0,
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
										}}
									>
										<Box
											style={{ width: livePaintingOptions.brushSize }}
											sx={{
												bgcolor: "text.primary",
												aspectRatio: 1,
												borderRadius: "50%",
											}}
										/>
									</Box>
									<Slider
										min={1}
										max={100}
										step={1}
										value={livePaintingOptions.brushSize}
										slotProps={{
											input: { autoFocus: true },
										}}
										onChange={(event, value) => {
											setLivePaintingOptions(previousState => ({
												...previousState,
												brushSize: value as number,
											}));
										}}
									/>
								</Box>
							</ClickAwayListener>
						}
					>
						<Tooltip title={t("labels:brushSize")} sx={{ py: 0.5, px: 0.75 }}>
							<IconButton
								size="md"
								aria-label={t("labels:brushSize")}
								sx={{ flexShrink: 0 }}
								onClick={() => {
									setBrushSizeOpen(true);
								}}
							>
								<BrushIcon />
							</IconButton>
						</Tooltip>
					</Tooltip>
					<Box sx={{ flex: 1 }} />
					<Tooltip title={t("labels:randomize")}>
						<IconButton
							size="md"
							aria-label={t("labels:randomize")}
							sx={{ flexShrink: 0 }}
							onClick={() => {
								setSettings(previousState => ({
									...previousState,
									seed: randomSeed(),
								}));
							}}
						>
							<CasinoIcon />
						</IconButton>
					</Tooltip>

					<Tooltip title={t("labels:clear")}>
						<IconButton
							size="md"
							aria-label={t("labels:clear")}
							onClick={() => {
								setClearCounter(previousState => previousState + 1);
							}}
						>
							<ClearIcon />
						</IconButton>
					</Tooltip>
				</Box>
				<Box
					sx={{
						display: "flex",
						gap: 1,
						flex: 1,
						px: 1,
						overflow: "hidden",
						alignItems: "center",
						flexShrink: 0,
						height: 44,
					}}
				>
					{hasModelAndVae ? (
						<Select
							variant="plain"
							value={modelSettings.id}
							onChange={(_event, value) => {
								send({ action: "livePainting:stop", payload: APP_ID });
								setIsLoading(true);
								setShouldRestart(true);
								switch (value) {
									case "sd-turbo": {
										setModelSettings({
											id: "sd-turbo",
											model_path: "stabilityai/sd-turbo",
											model_type: "stable-diffusion",
											vae_path: "madebyollin/taesd",
										});
										break;
									}

									case "sdxl-turbo": {
										setModelSettings({
											id: "sdxl-turbo",
											model_path:
												"stabilityai/sdxl-turbo/sd_xl_turbo_1.0_fp16.safetensors",
											model_type: "stable-diffusion-xl",
											vae_path: "madebyollin/taesdxl",
										});
										break;
									}

									default: {
										break;
									}
								}
							}}
						>
							{/*
							checkpoints.map(checkpoint => (
								<Option key={checkpoint.id} value={checkpoint.id}>
									{checkpoint.label}
								</Option>
							))
							*/}
							<Option value="sdxl-turbo">SDXL Turbo</Option>
							<Option value="sd-turbo">SD Turbo</Option>
						</Select>
					) : (
						<Button
							disabled={isDownloading}
							startDecorator={isDownloading ? <CircularProgress /> : <DownloadIcon />}
							onClick={() => {
								setIsDownloading(true);
								send({
									action: "cloneRepositories:start",
									payload: [
										{
											repository: "Blib-la/sd-turbo-fp16",
											destination: "stable-diffusion/checkpoints",
											label: "SD Turbo",
										},
										{
											repository: "madebyollin/taesd",
											destination: "stable-diffusion/vae",
											label: "Taesd",
										},
									],
								});
							}}
						>
							{t("labels:download")}
						</Button>
					)}
					<Button
						sx={{ flexShrink: 0 }}
						onClick={() => {
							setSettings(previousState => ({
								...previousState,
								strength: 1,
								steps: 2,
								guidance_scale: 0.5,
							}));
						}}
					>
						Fast
					</Button>
					<Button
						sx={{ flexShrink: 0 }}
						onClick={() => {
							setSettings(previousState => ({
								...previousState,
								strength: 0.95,
								steps: 3,
								guidance_scale: 1,
							}));
						}}
					>
						Default
					</Button>
					<Button
						sx={{ flexShrink: 0 }}
						onClick={() => {
							setSettings(previousState => ({
								...previousState,
								strength: 0.9,
								steps: 4,
								guidance_scale: 1.25,
							}));
						}}
					>
						Precise
					</Button>
					<Button
						sx={{ flexShrink: 0 }}
						onClick={() => {
							setSettings(previousState => ({
								...previousState,
								strength: 0.85,
								steps: 5,
								guidance_scale: 1.5,
							}));
						}}
					>
						Extreme
					</Button>

					<Box sx={{ flex: 1 }} />

					<Button
						color={saved ? "success" : "neutral"}
						variant="soft"
						startDecorator={saved ? <CheckIcon /> : <SaveIcon />}
						onClick={saveImage}
					>
						{saved ? t("labels:saved") : t("labels:save")}
					</Button>
				</Box>
			</Sheet>
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
				<Box
					sx={{
						width: {
							xs: "100%",
							md: isOverlay ? "100%" : "50%",
						},
						minWidth: "min-content",
						position: isOverlay ? "absolute" : "relative",
						inset: 0,
						zIndex: 1,
						p: 1,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<DrawingArea isOverlay={isOverlay} />
				</Box>
				<Box
					sx={{
						width: {
							xs: "100%",
							md: isOverlay ? "100%" : "50%",
						},
						minWidth: "min-content",
						position: "relative",
						flex: isOverlay ? 1 : undefined,
						zIndex: 0,
						p: 1,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<RenderingArea />
				</Box>
			</Sheet>
			<Sheet
				variant="soft"
				sx={{
					display: "flex",
					gap: 1,
					flexDirection: { xs: "column", md: "row" },
					px: 1,
					py: 2,
				}}
			>
				<FormControl sx={{ minWidth: 200 }}>
					<FormLabel>{t("labels:artStyle")}</FormLabel>
					<Select
						value={illustrationStyle}
						renderValue={option =>
							option && (
								<Typography>
									{t(`labels:illustrationStyles.${option.value}`)}
								</Typography>
							)
						}
						onChange={(_event, value_) => {
							if (value_) {
								setIllustrationStyle(value_);
							}
						}}
					>
						{Object.entries(illustrationStyles).map(([key_]) => (
							<Option
								key={key_}
								value={key_}
								sx={{ flexDirection: "column", alignItems: "stretch" }}
							>
								<Typography>{t(`labels:illustrationStyles.${key_}`)}</Typography>
								{key_ === "custom" && (
									<Typography level="body-xs" component="div">
										{t(`labels:illustrationStyles.customInfo`)}
									</Typography>
								)}
							</Option>
						))}
					</Select>
				</FormControl>
				<FormControl sx={{ flex: 1 }}>
					<FormLabel>{t("labels:prompt")}</FormLabel>
					<Textarea
						minRows={3}
						maxRows={3}
						value={prompt}
						startDecorator={
							<Typography startDecorator={<FlagUs />} level="body-xs">
								{t("labels:promptInfo")}
							</Typography>
						}
						onChange={event => {
							setPrompt(event.target.value);
						}}
					/>
				</FormControl>
			</Sheet>
		</Box>
	);
}
