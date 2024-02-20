import SvgIcon from "@mui/joy/SvgIcon";
import { useId } from "react";

// Logic for a 24x24 bounding-box
const stripeHeight = 24 / 13;
const boxHeight = stripeHeight * 7;
const columnWidth = 12 / 5.5;
const rowHeight = boxHeight / 4.5;

export function FlagUs() {
	const stripes = useId();
	const stars = useId();

	return (
		<SvgIcon>
			<defs>
				<pattern
					height={stripeHeight * 2}
					id={stripes}
					patternUnits="userSpaceOnUse"
					width={24}
				>
					<rect fill="#b31942" height={stripeHeight * 2} width={24} x={0} y={0} />
					<rect fill="#ffffff" height={stripeHeight} width={24} x={0} y={stripeHeight} />
				</pattern>
				<pattern
					height={rowHeight}
					id={stars}
					patternUnits="userSpaceOnUse"
					width={columnWidth}
				>
					<circle
						cx={columnWidth / 4}
						cy={rowHeight / 4}
						fill="#fffffff"
						r={columnWidth / 5}
					/>
					<circle
						cx={(columnWidth / 8) * 6}
						cy={(rowHeight / 8) * 6}
						fill="#fffffff"
						r={columnWidth / 5}
					/>
				</pattern>
			</defs>
			<rect fill={`url(#${stripes})`} height={24} width={24} x={0} y={0} />
			<rect fill="#0a3161" height={boxHeight} width={12} x={0} y={0} />
			<rect fill={`url(#${stars})`} height={boxHeight} width={12} x={0} y={0} />
		</SvgIcon>
	);
}
