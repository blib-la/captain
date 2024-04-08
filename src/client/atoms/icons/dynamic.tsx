import type { SvgIconProps } from "@mui/joy/SvgIcon";
import dynamic from "next/dynamic";
import { createElement } from "react";

const Brush = dynamic(() => import("@mui/icons-material/Brush"));
const DarkMode = dynamic(() => import("@mui/icons-material/DarkMode"));
const Dashboard = dynamic(() => import("@mui/icons-material/Dashboard"));
const Flag = dynamic(() => import("@mui/icons-material/Flag"));
const Folder = dynamic(() => import("@mui/icons-material/Folder"));
const Image = dynamic(() => import("@mui/icons-material/Image"));
const Images = dynamic(() => import("@mui/icons-material/Collections"));
const LightMode = dynamic(() => import("@mui/icons-material/LightMode"));
const TextSnippet = dynamic(() => import("@mui/icons-material/TextSnippet"));
const MenuBook = dynamic(() => import("@mui/icons-material/MenuBook"));
const Settings = dynamic(() => import("@mui/icons-material/Settings"));
const QuestionMark = dynamic(() => import("@mui/icons-material/QuestionMark"));

const iconCache: Record<string, any> = {
	Brush,
	DarkMode,
	Dashboard,
	Flag,
	Folder,
	Image,
	Images,
	LightMode,
	MenuBook,
	QuestionMark,
	Settings,
	TextSnippet,
	markdown: TextSnippet,
	image: Image,
	none: QuestionMark,
};

export function DynamicIcon({ icon, ...rest }: { icon: string } & SvgIconProps) {
	const component = iconCache[icon] ?? null;
	return component && createElement(component, rest);
}
