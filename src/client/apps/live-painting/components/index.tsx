import { useRequiredDownloads } from "@captn/react/use-required-downloads";
import { useSDK } from "@captn/react/use-sdk";
import { ClickAwayListener } from "@mui/base";
import CheckIcon from "@mui/icons-material/Check";
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
import type { IconButtonProps } from "@mui/joy/IconButton";
import IconButton from "@mui/joy/IconButton";
import Option from "@mui/joy/Option";
import Select from "@mui/joy/Select";
import Sheet from "@mui/joy/Sheet";
import Slider, { type SliderProps } from "@mui/joy/Slider";
import Textarea from "@mui/joy/Textarea";
import Tooltip from "@mui/joy/Tooltip";
import Typography from "@mui/joy/Typography";
import { useTranslation } from "next-i18next";
import {
	type DetailedHTMLProps,
	type InputHTMLAttributes,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import type { Except } from "type-fest";
import { v4 } from "uuid";

import { allRequiredDownloads, APP_ID } from "../constants";
import { StyledColorInput } from "../styled";
import type { IllustrationStyles } from "../text-to-image";
import { illustrationStyles } from "../text-to-image";

import type { Repository } from "#/types";
import { FlagUs } from "@/atoms/flags/us";
import { useResettableState } from "@/ions/hooks/resettable-state";
import { getContrastColor } from "@/ions/utils/color";

export interface ColorSelectorProperties
	extends Except<
		DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>,
		"value"
	> {
	label: string;
	value: string;
}

export function ColorInputButton({ value, label, onChange }: ColorSelectorProperties) {
	return (
		<Tooltip title={label}>
			<IconButton
				component="label"
				tabIndex={-1}
				aria-label={label}
				sx={{
					"--Icon-color": "currentColor",
					overflow: "hidden",
				}}
				style={{
					backgroundColor: value,
					color: getContrastColor(value),
				}}
			>
				<StyledColorInput type="color" value={value} onChange={onChange} />
				<PaletteIcon />
			</IconButton>
		</Tooltip>
	);
}

export interface PopupSLiderProperties extends Except<SliderProps, "value"> {
	label: string;
	value: number;
}

export function PopupSlider({ label, value, children, ...properties }: PopupSLiderProperties) {
	const [isOpen, setIsOpen] = useState(false);
	return (
		<Tooltip
			disableInteractive={false}
			open={isOpen}
			variant="soft"
			sx={{ p: 0 }}
			placement="bottom-start"
			title={
				<ClickAwayListener
					onClickAway={() => {
						setIsOpen(false);
					}}
				>
					<Box
						sx={{ display: "flex", width: 300, px: 2, py: 1, gap: 2 }}
						onMouseLeave={() => {
							setIsOpen(false);
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
								style={{ width: value }}
								sx={{
									bgcolor: "text.primary",
									aspectRatio: 1,
									borderRadius: "50%",
								}}
							/>
						</Box>
						<Slider
							{...properties}
							value={value}
							slotProps={{
								input: { autoFocus: true },
							}}
						/>
					</Box>
				</ClickAwayListener>
			}
		>
			<Tooltip title={label} sx={{ py: 0.5, px: 0.75 }}>
				<IconButton
					aria-label={label}
					sx={{ flexShrink: 0 }}
					onClick={() => {
						setIsOpen(true);
					}}
				>
					{children}
				</IconButton>
			</Tooltip>
		</Tooltip>
	);
}

export interface TooltipButtonProperties extends IconButtonProps {
	label: string;
}

export function TooltipButton({ label, children, ...properties }: TooltipButtonProperties) {
	return (
		<Tooltip title={label}>
			<IconButton aria-label={label} {...properties}>
				{children}
			</IconButton>
		</Tooltip>
	);
}

export function ModelSelect() {
	const { t } = useTranslation(["common", "labels"]);

	const [checkpoints, setCheckpoints] = useState<Repository[]>([]);
	const [vae, setVae] = useState<Repository[]>([]);
	const [isDownloading, setIsDownloading] = useState(false);
	const hasModelAndVae = checkpoints.length > 0 && vae.length > 0;

	const { send } = useSDK<unknown, string>(APP_ID, {});

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

	return hasModelAndVae ? (
		<Select variant="plain" defaultValue={checkpoints[0].id}>
			{checkpoints.map(checkpoint => (
				<Option key={checkpoint.id} value={checkpoint.id}>
					{checkpoint.label}
				</Option>
			))}
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
	);
}

export function SaveButton({ image, prompt }: { image: string; prompt: string }) {
	const { t } = useTranslation(["common", "labels"]);
	const [saved, setSaved] = useResettableState(false, 3000);
	const promptCache = useRef(prompt);
	const imageCache = useRef(image);
	const { writeFile } = useSDK<unknown, string>(APP_ID, {});
	const saveImage = useCallback(async () => {
		const id = v4();
		await writeFile(
			`images/${id}.png`,
			image.split(";base64,").pop()!,
			{
				encoding: "base64",
			},
			promptCache.current
		);
		setSaved(true);
	}, [image, writeFile, setSaved]);

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

export interface PromptSheetProperties {
	illustrationStyle: IllustrationStyles;
	prompt: string;
	onIllustrationStyleChange(value: IllustrationStyles): void;
	onPromptChange(value: string): void;
}

export function PromptSheet({
	illustrationStyle,
	prompt,
	onIllustrationStyleChange,
	onPromptChange,
}: PromptSheetProperties) {
	const { t } = useTranslation(["common", "labels"]);
	return (
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
							onIllustrationStyleChange(value_);
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
						onPromptChange(event.target.value);
					}}
				/>
			</FormControl>
		</Sheet>
	);
}

export interface RunButtonProperties {
	isLoading: boolean;
	isRunning: boolean;
	onStop(): void;
	onStart(): void;
}

export function RunButton({ isLoading, isRunning, onStart, onStop }: RunButtonProperties) {
	const { t } = useTranslation(["common", "labels"]);
	const { isCompleted: hasModelAndVae } = useRequiredDownloads(allRequiredDownloads);

	return isRunning ? (
		<Button
			disabled={isLoading || !hasModelAndVae}
			color="danger"
			variant="soft"
			startDecorator={isLoading ? <CircularProgress /> : <StopIcon />}
			onClick={() => {
				onStop();
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
				onStart();
			}}
		>
			{t("labels:start")}
		</Button>
	);
}
