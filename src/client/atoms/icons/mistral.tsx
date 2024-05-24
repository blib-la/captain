import type { SvgIconProps } from "@mui/material/SvgIcon";
import SvgIcon from "@mui/material/SvgIcon";

export default function MistralIcon(properties: SvgIconProps) {
	return (
		<SvgIcon {...properties} viewBox="0 0 24 24">
			<path
				d="M17,14h2v8.01h-2v-8.01ZM17,1.99v4h2V1.99h-2ZM13,10h2v-4h-2v4ZM9,18h2v-4h-2v4ZM1,5.99h0v16.01h2V6h0V1.99H1v4Z"
				style={{ opacity: 0.5 }}
			/>
			<path d="M23.01,1.99v8h-8.01v-4h4.01V1.99h4ZM11,5.99h-4.01V1.99H2.99v8h8.01v-4ZM2.99,22.01h4v-4H2.99v4ZM3,14h-.01v4h4v-4h4.01v4h4v-4h4.01v8h4v-12H3v4Z" />
		</SvgIcon>
	);
}
