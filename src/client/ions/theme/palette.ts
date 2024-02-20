import { mixColors } from "@/ions/utils/color";

export type Shade = "50" | "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900";
export type ColorShades = Record<Shade, string>;

export interface Palette {
	grey: ColorShades;
	blue: ColorShades;
	teal: ColorShades;
	green: ColorShades;
	lime: ColorShades;
	yellow: ColorShades;
	orange: ColorShades;
	red: ColorShades;
	pink: ColorShades;
	violet: ColorShades;
}

export const palette: Palette = {
	grey: {
		50: "#F2F2F2",
		100: "#D6D6D6",
		200: "#B2B2B2",
		300: "#969696",
		400: "#8E8E8E",
		500: "#717676",
		600: "#5A5A5A",
		700: "#444444",
		800: "#2E2E2E",
		900: "#191919",
	},
	blue: {
		50: "#E4F1FF",
		100: "#C8DCFF",
		200: "#A9C5FF",
		300: "#88ACFF",
		400: "#6691FF",
		500: "#296BFA",
		600: "#1D59D3",
		700: "#1A47AD",
		800: "#163285",
		900: "#122464",
	},
	teal: {
		50: "#E5F5F1",
		100: "#C9E2DB",
		200: "#ADD1C7",
		300: "#8FC0B2",
		400: "#6FAF9D",
		500: "#20827c",
		600: "#1C746E",
		700: "#186660",
		800: "#135852",
		900: "#0F4A44",
	},
	green: {
		50: "#E5F9E7",
		100: "#C0EDC2",
		200: "#9AE19D",
		300: "#75D678",
		400: "#4FCB53",
		500: "#058649",
		600: "#04743E",
		700: "#036233",
		800: "#025128",
		900: "#01411D",
	},
	lime: {
		50: "#F1F8E2",
		100: "#D9E5B8",
		200: "#C1D28E",
		300: "#A9BF64",
		400: "#91AC3A",
		500: "#4D822F",
		600: "#436E29",
		700: "#395A23",
		800: "#2F461D",
		900: "#253217",
	},
	yellow: {
		50: "#FFF3D6",
		100: "#FFE4AB",
		200: "#FFD47F",
		300: "#FFC353",
		400: "#E6AA28",
		500: "#9F6B00",
		600: "#7F5400",
		700: "#5E3F00",
		800: "#3E2900",
		900: "#1F1400",
	},
	orange: {
		50: "#FFE9DF",
		100: "#FFC4A8",
		200: "#FF9E72",
		300: "#FF783C",
		400: "#FF561B",
		500: "#D3410C",
		600: "#AC340B",
		700: "#852709",
		800: "#5E1B08",
		900: "#3E1206",
	},
	red: {
		50: "#FFE6E5",
		100: "#FFC2BF",
		200: "#FF9D99",
		300: "#FF7673",
		400: "#FF4F4C",
		500: "#DF2F2D",
		600: "#B02625",
		700: "#811D1C",
		800: "#611717",
		900: "#4D1212",
	},
	pink: {
		50: "#FDF2F9",
		100: "#FCE8F3",
		200: "#FAD1E8",
		300: "#F8ABD4",
		400: "#F686BA",
		500: "#DB2777",
		600: "#BE185D",
		700: "#9D174D",
		800: "#831843",
		900: "#6D1835",
	},
	violet: {
		50: "#ECE7FF",
		100: "#D1C5FF",
		200: "#B6A2FF",
		300: "#927fff",
		400: "#806aff",
		500: "#6C5EF5",
		600: "#594ED3",
		700: "#463EB0",
		800: "#352D8C",
		900: "#281E6A",
	},
};

export const background = {
	light: {
		body: mixColors("#FFFFFF", palette.grey["50"], 0.5),
	},
	dark: {
		body: mixColors("#000000", palette.grey["900"], 0.5),
	},
};
