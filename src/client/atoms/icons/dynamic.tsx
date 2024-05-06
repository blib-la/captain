import { localFile } from "@captn/utils/string";
import Box from "@mui/joy/Box";
import type { SxProps } from "@mui/joy/styles/types";
import type { DefaultComponentProps } from "@mui/material/OverridableComponent";
import type { SvgIconProps } from "@mui/material/SvgIcon";
import type { SvgIconTypeMap } from "@mui/material/SvgIcon";
import { useAtom } from "jotai/index";
import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import { createElement } from "react";

import { thirdPartyAppsPathAtom } from "@/client/ions/atoms";

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
const ShoppingBag = dynamic(() => import("@mui/icons-material/ShoppingBag"));
const Stream = dynamic(() => import("@mui/icons-material/Stream"));
const QuestionMark = dynamic(() => import("@mui/icons-material/QuestionMark"));

const iconCache: Record<
	string,
	ComponentType<DefaultComponentProps<SvgIconTypeMap<object, "svg">>>
> = {
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
	ShoppingBag,
	Stream,
	TextSnippet,
	markdown: TextSnippet,
	image: Image,
	none: QuestionMark,
};

export function DynamicIcon({
	icon,
	appId,
	...rest
}: { icon: string; appId?: string } & SvgIconProps) {
	const [thirdPartyAppsPath] = useAtom(thirdPartyAppsPathAtom);

	if (icon.startsWith("./")) {
		return (
			<Box
				component="img"
				alt=""
				src={localFile(`${thirdPartyAppsPath}/${appId as string}/${icon}`)}
				sx={{
					...(rest.sx as SxProps),
					height: "1em",
					width: "1em",
					objectFit: "contain",
					objectPosition: "center",
				}}
			/>
		);
	}

	const component = iconCache[icon] ?? null;
	return component && createElement(component, rest as SvgIconProps);
}
