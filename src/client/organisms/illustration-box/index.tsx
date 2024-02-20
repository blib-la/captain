import Box from "@mui/joy/Box";
import type { ReactNode } from "react";

export function IllustrationBox({
	children,
	height,
	invert,
}: {
	children: ReactNode;
	height: number | string;
	invert?: boolean;
}) {
	return (
		<Box
			sx={{
				height,
				filter: `invert(${invert ? 0 : 1})`,
				mixBlendMode: invert ? "multiply" : "screen",
				"[data-joy-color-scheme='light'] &": {
					filter: `invert(${invert ? 1 : 0})`,
					mixBlendMode: invert ? "screen" : "multiply",
				},
				".lf-player-container": {
					overflow: "hidden",
					mx: "auto",
					height: "100%",
				},
			}}
		>
			{children}
		</Box>
	);
}
