import { ClickAwayListener } from "@mui/base";
import CasinoIcon from "@mui/icons-material/Casino";
import GpsFixedIcon from "@mui/icons-material/GpsFixed";
import PaletteIcon from "@mui/icons-material/Palette";
import type { BoxProps } from "@mui/joy/Box";
import Box from "@mui/joy/Box";
import Button from "@mui/joy/Button";
import FormControl from "@mui/joy/FormControl";
import FormLabel from "@mui/joy/FormLabel";
import type { IconButtonProps } from "@mui/joy/IconButton";
import IconButton from "@mui/joy/IconButton";
import type { InputProps } from "@mui/joy/Input";
import Input from "@mui/joy/Input";
import Option from "@mui/joy/Option";
import Select from "@mui/joy/Select";
import Sheet from "@mui/joy/Sheet";
import type { SliderProps } from "@mui/joy/Slider";
import Slider from "@mui/joy/Slider";
import type { ColorPaletteProp, VariantProp } from "@mui/joy/styles/types";
import Textarea from "@mui/joy/Textarea";
import Tooltip from "@mui/joy/Tooltip";
import Typography from "@mui/joy/Typography";
import type { SystemCssProperties } from "@mui/system/styleFunctionSx/styleFunctionSx";
import { useTranslation } from "next-i18next";
import type { ReactNode } from "react";
import { type DetailedHTMLProps, type InputHTMLAttributes, useState } from "react";
import type { Except } from "type-fest";

import type { IllustrationStyles } from "./illustration-styles";
import { illustrationStyles } from "./illustration-styles";

import { StyledColorInput } from "@/client/apps/live-painting/styled";
import type { Size } from "@/client/apps/shared/constants";
import { FlagUs } from "@/client/atoms/flags/us";
import { getContrastColor } from "@/client/ions/utils/color";

export interface PromptSheetProperties {
	illustrationStyle: IllustrationStyles;
	prompt: string;
	negativePrompt?: string;
	flexDirection?: SystemCssProperties["flexDirection"];
	onIllustrationStyleChange(value: IllustrationStyles): void;
	onPromptChange(value: string): void;
	onNegativePromptChange?(value: string): void;
}

export function PromptSheet({
	illustrationStyle,
	prompt,
	negativePrompt = "",
	onIllustrationStyleChange,
	onPromptChange,
	onNegativePromptChange,
	flexDirection = { xs: "column", md: "row" },
}: PromptSheetProperties) {
	const { t } = useTranslation(["common", "labels"]);
	return (
		<Sheet
			variant="soft"
			sx={{
				display: "flex",
				gap: 1,
				flexDirection,
				px: 1,
				py: 2,
				minWidth: { lg: 400 },
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
					value={prompt}
					sx={{ flex: 1 }}
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
			{onNegativePromptChange && (
				<FormControl sx={{ flex: 1 }}>
					<FormLabel>{t("labels:negativePrompt")}</FormLabel>
					<Textarea
						minRows={3}
						value={negativePrompt}
						sx={{ flex: 1 }}
						startDecorator={
							<Typography startDecorator={<FlagUs />} level="body-xs">
								{t("labels:promptInfo")}
							</Typography>
						}
						onChange={event => {
							onNegativePromptChange(event.target.value);
						}}
					/>
				</FormControl>
			)}
		</Sheet>
	);
}

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

interface RadiusBoxProperties {
	value: number;
}
export function RadiusBox({ value }: RadiusBoxProperties) {
	return (
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
	);
}

export interface PopupSliderProperties extends Except<SliderProps, "value"> {
	label: string;
	value: number;
	width: number;
	button?: boolean;
	stopPropagation?: boolean;
	secondaryContent?: ReactNode;
}

export function PopupSlider({
	label,
	value,
	children,
	color,
	variant,
	secondaryContent,
	width,
	button,
	stopPropagation,
	...properties
}: PopupSliderProperties) {
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
						style={{ width }}
						sx={{ display: "flex", px: 2, py: 1, gap: 2 }}
						onMouseLeave={() => {
							setIsOpen(false);
						}}
					>
						{secondaryContent}
						<Slider
							{...properties}
							color={color}
							value={value}
							slotProps={{
								input: { autoFocus: true },
							}}
						/>
					</Box>
				</ClickAwayListener>
			}
			onClick={event => {
				event.stopPropagation();
			}}
		>
			{button ? (
				<Button
					color={color}
					variant={variant}
					startDecorator={children}
					sx={{ flexShrink: 0 }}
					onClick={event => {
						if (stopPropagation) {
							event.stopPropagation();
						}

						setIsOpen(true);
					}}
				>
					{label}
				</Button>
			) : (
				<Tooltip title={label} sx={{ py: 0.5, px: 0.75 }}>
					<IconButton
						aria-label={label}
						color={color}
						variant={variant}
						sx={{ flexShrink: 0 }}
						onClick={event => {
							if (stopPropagation) {
								event.stopPropagation();
							}

							setIsOpen(true);
						}}
					>
						{children}
					</IconButton>
				</Tooltip>
			)}
		</Tooltip>
	);
}

export interface PopupRadiusSliderProperties extends Except<SliderProps, "value"> {
	label: string;
	value: number;
	width?: number;
}

export function PopupRadiusSlider({
	value,
	children,
	width = 300,
	...properties
}: PopupRadiusSliderProperties) {
	return (
		<PopupSlider
			value={value}
			width={width}
			{...properties}
			secondaryContent={<RadiusBox value={value} />}
		>
			{children}
		</PopupSlider>
	);
}

export interface PopupButtonProperties extends BoxProps {
	label: string;
	icon?: ReactNode;
	button?: boolean;
	stopPropagation?: boolean;
	color?: ColorPaletteProp;
	variant?: VariantProp;
}

export function PopupButton({
	label,
	icon,
	button,
	color,
	variant,
	stopPropagation,
	children,
	...properties
}: PopupButtonProperties) {
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
						sx={{ display: "flex", px: 2, py: 1, gap: 2 }}
						onMouseLeave={() => {
							setIsOpen(false);
						}}
					>
						<Box {...properties}>{children}</Box>
					</Box>
				</ClickAwayListener>
			}
			onClick={event => {
				if (stopPropagation) {
					event.stopPropagation();
				}
			}}
		>
			{button ? (
				<Button
					color={color}
					variant={variant}
					startDecorator={icon}
					sx={{ flexShrink: 0 }}
					onClick={event => {
						if (stopPropagation) {
							event.stopPropagation();
						}

						setIsOpen(true);
					}}
				>
					{label}
				</Button>
			) : (
				<Tooltip title={label} sx={{ py: 0.5, px: 0.75 }}>
					<IconButton
						color={color}
						variant={variant}
						aria-label={label}
						sx={{ flexShrink: 0 }}
						onClick={event => {
							if (stopPropagation) {
								event.stopPropagation();
							}

							setIsOpen(true);
						}}
					>
						{icon}
					</IconButton>
				</Tooltip>
			)}
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

export interface SizeSelectorProperties {
	value: Size;
	selectLabel: string;

	onChange?(_size: Size): void;

	sizes: Size[];
}

export function SizeSelector({ value, selectLabel, sizes, onChange }: SizeSelectorProperties) {
	const [hovered, setHovered] = useState(sizes.findIndex(size => size.id === value.id));
	return (
		<Box sx={{ position: "relative", width: 500, aspectRatio: 1 }}>
			<Box sx={{ position: "absolute", top: 0, left: 0 }}>
				<Select
					value={value.id}
					aria-label={selectLabel}
					slotProps={{ listbox: { sx: theme => ({ zIndex: theme.zIndex.tooltip }) } }}
					sx={{ width: 100 }}
					onChange={(_event, value) => {
						const size = sizes.find(size_ => size_.id === value);
						if (size && onChange) {
							onChange(size);
						}
					}}
				>
					{sizes.map((size, index) => (
						<Option
							key={size.id}
							value={size.id}
							onMouseEnter={() => {
								setHovered(index);
							}}
							onMouseLeave={() => {
								setHovered(-1);
							}}
						>
							{size.label}
						</Option>
					))}
				</Select>
			</Box>
			{sizes.map((size, index) => {
				const hovered_ = hovered === index;
				const selected = value.id === size.id;
				const zIndex = selected ? 1 : 0;
				const variant = selected ? "solid" : "outlined";
				return (
					<Button
						key={size.id}
						variant={hovered_ ? "soft" : variant}
						color={size.color}
						style={{ zIndex: hovered_ ? 2 : zIndex }}
						sx={{
							height: "auto",
							width: `${(size.width / 1530) * 100}%`,
							position: "absolute",
							top: "50%",
							left: "50%",
							transform: "translate(-50%, -50%)",
							aspectRatio: size.width / size.height,
						}}
						onMouseEnter={() => {
							setHovered(index);
						}}
						onMouseLeave={() => {
							setHovered(-1);
						}}
						onClick={() => {
							if (onChange) {
								onChange(size);
							}
						}}
					>
						{size.label}
					</Button>
				);
			})}
		</Box>
	);
}

export function SeedField({
	value,
	lastSeed,
	label,
	fixedLabel,
	randomLabel,
	onChange,
}: Except<InputProps, "type" | "endDecorator" | "slotProps" | "onChange" | "value"> & {
	label: string;
	randomLabel: string;
	fixedLabel: string;
	onChange(_seed: number): void;
	value: number;
	lastSeed: number;
}) {
	const isRandom = value < 0;
	return (
		<Input
			type="number"
			aria-label={label}
			value={value.toString()}
			slotProps={{ input: { type: "number", min: -1, step: 1 } }}
			sx={{ width: 220 }}
			endDecorator={
				<TooltipButton
					label={isRandom ? fixedLabel : randomLabel}
					onClick={() => {
						if (isRandom) {
							onChange(lastSeed);
						} else {
							onChange(-1);
						}
					}}
				>
					{isRandom ? <GpsFixedIcon /> : <CasinoIcon />}
				</TooltipButton>
			}
			onChange={event => {
				onChange(Number.parseInt(event.target.value, 10));
			}}
		/>
	);
}
