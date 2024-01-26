import dynamic from "next/dynamic";
import React, { useId } from "react";
import { Box } from "@mui/joy";

const LottiePlayer = dynamic(
  () => import("@/atoms/lottie-player").then((module_) => module_.LottiePlayer),
  { ssr: false },
);

export function Lottie({ path, height }: { path: string; height: number }) {
  const id = useId();
  return (
    <Box
      sx={{
        filter: "invert(1)",
        mixBlendMode: "screen",
        "[data-joy-color-scheme='light'] &": {
          filter: "unset",
          mixBlendMode: "multiply",
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
