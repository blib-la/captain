import SvgIcon from "@mui/joy/SvgIcon";

export function FlagZh() {
	return (
		<SvgIcon viewBox="0 0 24 24">
			<rect fill="#ee1c25" height={24} width={24} x={0} y={0} />
			<circle fill="#ffff00" cx={6} cy={6} r={3} />
			{Array.from({ length: 4 }, (_, index) => {
				const x = Math.cos(((Math.PI / 2) * index) / 1.5 + 1.5) * -3;
				const y = Math.sin(((Math.PI / 2) * index) / 1.5 + 1.5) * -3;
				return <circle key={index} fill="#ffff00" cx={10 + x} cy={6 + y} r={1} />;
			})}
		</SvgIcon>
	);
}
