import type { SvgIconProps } from "@mui/material/SvgIcon";
import SvgIcon from "@mui/material/SvgIcon";
import type { Except } from "type-fest";

export function SizeIcon(properties: Except<SvgIconProps, "children" | "viewBox">) {
	return (
		<SvgIcon {...properties} viewBox="0 0 24 24">
			<path d="M17.7 17.7L16.6 18.8L15.9 18L17 17L15 15L14 16.1L13.3 15.4L14.4 14.3L12.5 12.4L11.4 13.5L10.7 12.8L11.8 11.7L9.8 9.8L8.7 10.9L8 10.2L9 9L7.1 7.1L6 8.1L5.3 7.4L6.4 6.3L4 4V20H20L17.7 17.7M7 17V11.2L12.8 17H7Z" />
		</SvgIcon>
	);
}

export function TimerIcon(properties: Except<SvgIconProps, "children" | "viewBox">) {
	return (
		<SvgIcon {...properties} viewBox="0 0 24 24">
			<path d="M15 3H9V1H15V3M13 19C13 20.03 13.26 21 13.71 21.83C13.16 21.94 12.59 22 12 22C7.03 22 3 17.97 3 13S7.03 4 12 4C14.12 4 16.07 4.74 17.62 6L19.04 4.56C19.55 5 20 5.46 20.45 5.97L19.03 7.39C20.26 8.93 21 10.88 21 13C21 13.12 21 13.23 21 13.35C20.36 13.13 19.7 13 19 13C15.69 13 13 15.69 13 19M13 7H11V14H13V7M20 18V15H18V18H15V20H18V23H20V20H23V18H20Z" />
		</SvgIcon>
	);
}
