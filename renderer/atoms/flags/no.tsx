import SvgIcon from "@mui/joy/SvgIcon";

export function FlagNo() {
	return (
		<SvgIcon>
			<rect fill="#ba0c2f" height={24} width={24} x={0} y={0} />
			<path d="M 9 0 L 9 24 M 0 12 L 24 12" fill="none" stroke="#ffffff" strokeWidth={6} />
			<path d="M 9 0 L 9 24 M 0 12 L 24 12" fill="none" stroke="#00205b" strokeWidth={4} />
		</SvgIcon>
	);
}
