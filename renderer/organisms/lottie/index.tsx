import Box from "@mui/joy/Box";
import { useId } from "react";

import { LottiePlayer } from "@/atoms/lottie-player";
/*
Const LottiePlayer = dynamic(
	() => import("@/atoms/lottie-player").then(module_ => module_.LottiePlayer),
	{ ssr: false }
);
*/

export function Lottie({
	path,
	height,
	invert,
}: {
	path: string;
	height: number;
	invert?: boolean;
}) {
	const id = useId();
	return (
		<Box
			sx={{
				filter: `invert(${invert ? 0 : 1})`,
				mixBlendMode: invert ? "multiply" : "screen",
				"[data-joy-color-scheme='light'] &": {
					filter: `invert(${invert ? 1 : 0})`,
					mixBlendMode: invert ? "screen" : "multiply",
				},
				".lf-player-container": {
					overflow: "hidden",
					mx: "auto",
					height,
				},
			}}
		>
			<LottiePlayer id={id} src={path} style={{ height: "100%" }} />
		</Box>
	);
}
