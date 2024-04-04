import type { SvgIconProps } from "@mui/joy/SvgIcon";
import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import { createElement, useEffect, useState } from "react";

const Brush = dynamic(() => import("@mui/icons-material/Brush"));
const MenuBook = dynamic(() => import("@mui/icons-material/MenuBook"));
const Settings = dynamic(() => import("@mui/icons-material/Settings"));

const iconCache: Record<string, any> = {
	Brush,
	MenuBook,
	Settings,
};

export function DynamicIcon({ icon, ...rest }: { icon: string } & SvgIconProps) {
	const [component, setComponent] = useState<ComponentType<SvgIconProps>>(
		iconCache[icon] ?? null
	);
	useEffect(() => {
		import("@mui/icons-material").then(module_ => {
			iconCache[icon] ||= module_[icon] ?? null;
			setComponent(iconCache[icon]);
		});
	}, [icon]);
	return component ? createElement(component, rest) : null;
}
