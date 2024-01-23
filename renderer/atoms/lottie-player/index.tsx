import type { IPlayerProps } from "@lottiefiles/react-lottie-player";
import { Player } from "@lottiefiles/react-lottie-player";

export function LottiePlayer(properties: IPlayerProps) {
  return <Player {...properties} autoplay loop />;
}
