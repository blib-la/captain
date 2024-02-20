import Box from "@mui/joy/Box";

import { IllustrationBox } from "@/organisms/illustration-box";

export function Illustration({
	path,
	height,
	invert,
}: {
	path: string;
	height: number | string;
	invert?: boolean;
}) {
	return (
		<IllustrationBox height={height} invert={invert}>
			<Box
				component="img"
				src={path}
				sx={{
					height: "100%",
					width: "100%",
					objectFit: "contain",
					objectPosition: "center",
				}}
			/>
		</IllustrationBox>
	);
}
