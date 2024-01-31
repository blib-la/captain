import type { IPlayerProps } from "@lottiefiles/react-lottie-player";
import { Player } from "@lottiefiles/react-lottie-player";
import { useId } from "react";

export function LottiePlayer(properties: IPlayerProps) {
	const id = useId();
	return <Player id={id} {...properties} autoplay loop />;
}
