import type { SvgIconProps } from "@mui/joy/SvgIcon";
import SvgIcon from "@mui/joy/SvgIcon";

export function Logo(properties: SvgIconProps) {
	return (
		<SvgIcon viewBox="0 0 20 28" {...properties}>
			<path
				d="m10,0C4.49,0,0,4.49,0,10s4.49,10,10,10c1.99,0,3.89-.58,5.52-1.66l1.07,1.07c.38.38.89.59,1.41.59.26,0,.52-.05.76-.15.75-.31,1.23-1.04,1.23-1.85v-8C20,4.49,15.51,0,10,0Zm8,18l-2.34-2.34c-1.45,1.45-3.45,2.34-5.66,2.34-4.42,0-8-3.58-8-8S5.58,2,10,2s8,3.58,8,8v8Zm-14,8c0,1.1-.9,2-2,2s-2-.9-2-2,.9-2,2-2,2,.9,2,2Zm16,0c0,1.1-.9,2-2,2s-2-.9-2-2,.9-2,2-2,2,.9,2,2Zm-8,0c0,1.1-.9,2-2,2s-2-.9-2-2,.9-2,2-2,2,.9,2,2Z"
				fill="currentColor"
			/>
		</SvgIcon>
	);
}
