import { useId } from "react";

import { LottiePlayer } from "@/client/atoms/lottie-player";
import { IllustrationBox } from "@/client/organisms/illustration-box";

/*
Const LottiePlayer = dynamic(
	() => import("@/client/atoms/lottie-player").then(module_ => module_.LottiePlayer),
	{ ssr: false }
);
*/

export function Lottie({
	path,
	height,
	invert,
}: {
	path: string;
	height: number | string;
	invert?: boolean;
}) {
	const id = useId();
	return (
		<IllustrationBox invert={invert} height={height}>
			<LottiePlayer id={id} src={path} style={{ height: "100%" }} />
		</IllustrationBox>
	);
}
