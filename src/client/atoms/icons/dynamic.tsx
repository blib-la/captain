import type { SvgIconProps } from "@mui/joy/SvgIcon";
import dynamic from "next/dynamic";
import { createElement } from "react";

const Brush = dynamic(() => import("@mui/icons-material/Brush"));
const DarkMode = dynamic(() => import("@mui/icons-material/DarkMode"));
const Flag = dynamic(() => import("@mui/icons-material/Flag"));
const LightMode = dynamic(() => import("@mui/icons-material/LightMode"));
const MenuBook = dynamic(() => import("@mui/icons-material/MenuBook"));
const Settings = dynamic(() => import("@mui/icons-material/Settings"));

const iconCache: Record<string, any> = {
	Brush,
	DarkMode,
	Flag,
	LightMode,
	MenuBook,
	Settings,
};

export function DynamicIcon({ icon, ...rest }: { icon: string } & SvgIconProps) {
	const component = iconCache[icon] ?? null;
	return component && createElement(component, rest);
}
