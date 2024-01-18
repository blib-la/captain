import { extendTheme } from "@mui/joy/styles";

import { body, code, display } from "@/ions/fonts";
import { CSS_VARIABLE_PREFIX } from "@/ions/theme/constants";
import { background, palette } from "@/ions/theme/palette";
import { getCssVariable } from "@/ions/theme/utils";
import { hexToRGB } from "@/ions/utils/color";

const primaryColor = palette.teal;
const secondaryColor = palette.pink;
export const theme = extendTheme({
	cssVarPrefix: CSS_VARIABLE_PREFIX,
	colorSchemes: {
		light: {
			palette: {
				primary: {
					...primaryColor,
					plainColor: getCssVariable("palette-primary-600"),
					outlinedColor: getCssVariable("palette-primary-600"),
				},
				secondary: {
					...secondaryColor,
					plainColor: getCssVariable("palette-secondary-600"),
					plainHoverBg: getCssVariable("palette-secondary-100"),
					plainActiveBg: getCssVariable("palette-secondary-200"),
					plainDisabledColor: getCssVariable("palette-neutral-400"),
					outlinedColor: getCssVariable("palette-secondary-600"),
					outlinedBorder: getCssVariable("palette-secondary-300"),
					outlinedHoverBg: getCssVariable("palette-secondary-100"),
					outlinedActiveBg: getCssVariable("palette-secondary-200"),
					outlinedDisabledColor: getCssVariable("palette-neutral-400"),
					outlinedDisabledBorder: getCssVariable("palette-neutral-200"),
					softColor: getCssVariable("palette-secondary-700"),
					softBg: getCssVariable("palette-secondary-100"),
					softHoverBg: getCssVariable("palette-secondary-200"),
					softActiveColor: getCssVariable("palette-secondary-800"),
					softActiveBg: getCssVariable("palette-secondary-300"),
					softDisabledColor: getCssVariable("palette-neutral-400"),
					softDisabledBg: getCssVariable("palette-neutral-50"),
					solidColor: getCssVariable("palette-common-white, #FFF"),
					solidBg: getCssVariable("palette-secondary-500"),
					solidHoverBg: getCssVariable("palette-secondary-600"),
					solidActiveBg: getCssVariable("palette-secondary-700"),
					solidDisabledColor: getCssVariable("palette-neutral-400"),
					solidDisabledBg: getCssVariable("palette-neutral-100"),
					mainChannel: hexToRGB(secondaryColor["500"]).join(" "),
					lightChannel: hexToRGB(secondaryColor["100"]).join(" "),
					darkChannel: hexToRGB(secondaryColor["800"]).join(" "),
				},
				neutral: {
					...palette.grey,
					plainColor: getCssVariable("palette-neutral-800"),
					outlinedColor: getCssVariable("palette-neutral-800"),
				},
				danger: {
					...palette.red,
					plainColor: getCssVariable("palette-danger-800"),
					outlinedColor: getCssVariable("palette-danger-800"),
				},
				success: {
					...palette.green,
					plainColor: getCssVariable("palette-success-800"),
					outlinedColor: getCssVariable("palette-success-800"),
				},
				warning: {
					...palette.yellow,
					plainColor: getCssVariable("palette-warning-800"),
					outlinedColor: getCssVariable("palette-warning-800"),
				},
				text: {
					secondary: getCssVariable("palette-neutral-800"),
					tertiary: getCssVariable("palette-neutral-700"),
				},
				background: {
					body: background.light.body,
				},
			},
		},
		dark: {
			palette: {
				primary: {
					...primaryColor,
					plainColor: getCssVariable("palette-primary-300"),
					outlinedColor: getCssVariable("palette-primary-300"),
				},
				secondary: {
					...secondaryColor,
					plainColor: getCssVariable("palette-secondary-300"),
					plainHoverBg: getCssVariable("palette-secondary-800"),
					plainActiveBg: getCssVariable("palette-secondary-700"),
					plainDisabledColor: getCssVariable("palette-neutral-500"),
					outlinedColor: getCssVariable("palette-secondary-200"),
					outlinedBorder: getCssVariable("palette-secondary-700"),
					outlinedHoverBg: getCssVariable("palette-secondary-800"),
					outlinedActiveBg: getCssVariable("palette-secondary-700"),
					outlinedDisabledColor: getCssVariable("palette-neutral-500"),
					outlinedDisabledBorder: getCssVariable("palette-neutral-800"),
					softColor: getCssVariable("palette-secondary-200"),
					softBg: getCssVariable("palette-secondary-800"),
					softHoverBg: getCssVariable("palette-secondary-700"),
					softActiveColor: getCssVariable("palette-secondary-100"),
					softActiveBg: getCssVariable("palette-secondary-600"),
					softDisabledColor: getCssVariable("palette-neutral-500"),
					softDisabledBg: getCssVariable("palette-neutral-800"),
					solidColor: getCssVariable("palette-common-white, #FFF"),
					solidBg: getCssVariable("palette-secondary-500"),
					solidHoverBg: getCssVariable("palette-secondary-600"),
					solidDisabledColor: getCssVariable("palette-neutral-500, #636B74"),
					solidDisabledBg: getCssVariable("palette-neutral-800, #171A1C"),
					mainChannel: hexToRGB(secondaryColor["400"]).join(" "),
					lightChannel: hexToRGB(secondaryColor["100"]).join(" "),
					darkChannel: hexToRGB(secondaryColor["800"]).join(" "),
				},
				neutral: {
					...palette.grey,
					plainColor: getCssVariable("palette-neutral-100"),
					outlinedColor: getCssVariable("palette-neutral-100"),
				},
				danger: {
					...palette.red,
					plainColor: getCssVariable("palette-danger-100"),
					outlinedColor: getCssVariable("palette-danger-100"),
				},
				success: {
					...palette.green,
					plainColor: getCssVariable("palette-success-100"),
					outlinedColor: getCssVariable("palette-success-100"),
				},
				warning: {
					...palette.yellow,
					plainColor: getCssVariable("palette-warning-100"),
					outlinedColor: getCssVariable("palette-warning-100"),
				},
				text: {
					secondary: getCssVariable("palette-neutral-100"),
					tertiary: getCssVariable("palette-neutral-200"),
				},
				background: {
					body: background.dark.body,
				},
			},
		},
	},
	components: {
		JoyAlert: {
			styleOverrides: {
				root: { borderRadius: 4 },
			},
		},
		JoyButton: {
			styleOverrides: {
				root: { borderRadius: 0 },
			},
		},
		JoyButtonGroup: {
			styleOverrides: {
				root: { borderRadius: 0 },
			},
		},
		JoyCard: {
			defaultProps: {
				variant: "plain",
			},
			styleOverrides: {
				root: { width: "100%", borderRadius: 0 },
			},
		},
		JoyIconButton: {
			styleOverrides: {
				root: { borderRadius: 0 },
			},
		},
		JoyInput: {
			styleOverrides: {
				root: { borderRadius: 0, boxShadow: "none" },
			},
		},
		JoyLink: {
			styleOverrides: {
				root: {
					"[data-joy-color-scheme=light] &": {
						"&.MuiLink-colorNeutral": {
							color: getCssVariable("palette-neutral-700"),
						},
						"&.MuiLink-colorPrimary": {
							color: getCssVariable("palette-primary-700"),
						},
						"&.MuiLink-colorSecondary": {
							color: getCssVariable("palette-secondary-700"),
						},
						"&.MuiLink-colorDanger": {
							color: getCssVariable("palette-danger-700"),
						},
						"&.MuiLink-colorSuccess": {
							color: getCssVariable("palette-success-700"),
						},
						"&.MuiLink-colorWarning": {
							color: getCssVariable("palette-warning-700"),
						},
					},
					"[data-joy-color-scheme=dark] &": {
						"&.MuiLink-colorNeutral": {
							color: getCssVariable("palette-neutral-200"),
						},
						"&.MuiLink-colorPrimary": {
							color: getCssVariable("palette-primary-200"),
						},
						"&.MuiLink-colorSecondary": {
							color: getCssVariable("palette-secondary-200"),
						},
						"&.MuiLink-colorDanger": {
							color: getCssVariable("palette-danger-200"),
						},
						"&.MuiLink-colorSuccess": {
							color: getCssVariable("palette-success-200"),
						},
						"&.MuiLink-colorWarning": {
							color: getCssVariable("palette-warning-200"),
						},
					},
				},
			},
		},
		JoyModalClose: {
			styleOverrides: {
				root: { borderRadius: 0 },
			},
		},
		JoyModalDialog: {
			defaultProps: {
				variant: "plain",
			},
			styleOverrides: {
				root: { borderRadius: 4 },
			},
		},
		JoySelect: {
			styleOverrides: {
				root: {
					borderRadius: 0,
					boxShadow: "none",
					"&:focus-within::before": {
						boxShadow:
							"inset 0 0 0 var(--Select-focusedThickness) var(--Select-focusedHighlight)",
					},
				},
				listbox: {
					borderRadius: 0,
				},
			},
		},
		JoySlider: {
			styleOverrides: {
				thumb: {
					"&:focus-within": {
						outlineOffset: 0,
						outline: `${getCssVariable(
							"focus-thickness",
							"2px"
						)} solid ${getCssVariable("palette-focusVisible", "#0B6BCB")}`,
						outlineWidth: "max(4px, var(--Slider-thumbSize) / 3.6)",
						outlineColor: `rgba(${getCssVariable(
							"palette-primary-mainChannel"
						)} / 0.32)`,
					},
				},
			},
		},
		JoyTextarea: {
			styleOverrides: {
				root: { borderRadius: 0, boxShadow: "none" },
			},
		},
	},
	fontFamily: {
		display: display.style.fontFamily,
		body: body.style.fontFamily,
		code: code.style.fontFamily,
	},
});
