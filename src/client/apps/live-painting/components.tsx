import { ClickAwayListener } from "@mui/base";
import PaletteIcon from "@mui/icons-material/Palette";
import Box from "@mui/joy/Box";
import type { IconButtonProps } from "@mui/joy/IconButton";
import IconButton from "@mui/joy/IconButton";
import Slider, { type SliderProps } from "@mui/joy/Slider";
import Tooltip from "@mui/joy/Tooltip";
import { type DetailedHTMLProps, type InputHTMLAttributes, useState } from "react";
import type { Except } from "type-fest";

import { StyledColorInput } from "./styled";

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

export interface PopupSliderProperties extends Except<SliderProps, "value"> {
	label: string;
	value: number;
}

export function PopupSlider({ label, value, children, ...properties }: PopupSliderProperties) {
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
