import type { ColorPaletteProp } from "@mui/joy/styles/types";

export interface Size {
	width: number;
	height: number;
	id: string;
	label: string;
	color: ColorPaletteProp;
}

export const sizes: Size[] = [
	{ id: "1", height: 1536, width: 640, label: "12:5", color: "red" },
	{ id: "2", height: 1344, width: 768, label: "7:4", color: "orange" },
	{ id: "3", height: 1216, width: 832, label: "19:13", color: "yellow" },
	{ id: "4", height: 1152, width: 896, label: "9:7", color: "lime" },
	{ id: "5", height: 1024, width: 1024, label: "1:1", color: "green" },
	{ id: "6", height: 896, width: 1152, label: "7:9", color: "teal" },
	{ id: "7", height: 832, width: 1216, label: "13:19", color: "blue" },
	{ id: "8", height: 768, width: 1344, label: "4:7", color: "violet" },
	{ id: "9", height: 640, width: 1536, label: "12:5", color: "pink" },
];
