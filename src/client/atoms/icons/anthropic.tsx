import type { SvgIconProps } from "@mui/material/SvgIcon";
import SvgIcon from "@mui/material/SvgIcon";

export default function AnthropicIcon(properties: SvgIconProps) {
	return (
		<SvgIcon {...properties} viewBox="0 0 28 28">
			<path d="M20 4h-4.3l7.7 19.5h4.2L20 4ZM7.6 4 0 23.5h4.3L6 19.4h8l1.6 4h4.3L12.1 4H7.7Zm-.4 11.8 2.6-6.9 2.7 6.9H7.3Z" />
		</SvgIcon>
	);
}
