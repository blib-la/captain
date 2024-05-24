import type { SvgIconProps } from "@mui/material/SvgIcon";
import SvgIcon from "@mui/material/SvgIcon";

export default function MistralIcon(properties: SvgIconProps) {
	return (
		<SvgIcon {...properties} viewBox="0 0 24 24">
			<path d="M23.01,1.99v4h-4V1.99h4ZM2.99,5.99h4V1.99H2.99v4Z" fill="#f7d046" />
			<path d="M23.01,5.99v4h-8.01v-4h8.01ZM2.99,5.99v4h8.01v-4H2.99Z" fill="#f2a73b" />
			<path d="M11,14h4v4h-4v-4ZM19.01,14v4h4v-4h-4ZM2.99,18h4v-4H2.99v4Z" fill="#eb5829" />
			<path d="M23.01,18v4h-4v-4h4ZM2.99,22.01h4v-4H2.99v4Z" fill="#ea3326" />
			<path
				d="M17,14h2v8.01h-2v-8.01ZM17,1.99v4h2V1.99h-2ZM13,10h2v-4h-2v4ZM9,18h2v-4h-2v4ZM1,5.99h0v16.01h2V6h0V1.99H1v4Z"
				fill="#000"
			/>
			<path d="M23.01,14H3v-4h20.01v4Z" fill="#ee792f" />
		</SvgIcon>
	);
}
