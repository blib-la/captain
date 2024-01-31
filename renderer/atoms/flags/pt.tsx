import SvgIcon from "@mui/joy/SvgIcon";

export function FlagPt() {
	return (
		<SvgIcon>
			<rect fill="#006600" height={24} width={24} x={0} y={0} />
			<rect fill="#ff0000" height={24} width={16} x={8} y={0} />
			<circle fill="#ffff00" cx={8} cy={12} r={3} />
		</SvgIcon>
	);
}
