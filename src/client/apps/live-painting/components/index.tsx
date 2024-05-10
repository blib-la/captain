import { ClickAwayListener } from "@mui/base";
import PaletteIcon from "@mui/icons-material/Palette";
import Box from "@mui/joy/Box";
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
import { type DetailedHTMLProps, type InputHTMLAttributes, useState } from "react";
import type { Except } from "type-fest";

import type { IllustrationStyles } from "../illustration-styles";
import { illustrationStyles } from "../illustration-styles";
import { StyledColorInput } from "../styled";

import { FlagUs } from "@/client/atoms/flags/us";
import { getContrastColor } from "@/client/ions/utils/color";

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
