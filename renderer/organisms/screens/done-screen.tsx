import { useAtom } from "jotai";
import { directoryAtom } from "@/ions/atoms";
import { Button, Stack, Typography } from "@mui/joy";
import React from "react";
import dynamic from "next/dynamic";

const LottiePlayer = dynamic(
  () => import("@/atoms/lottie-player").then((module_) => module_.LottiePlayer),
  { ssr: false },
);
export function DoneScreen({ onDone }) {
  const [directory, setDirectory] = useAtom(directoryAtom);
  return (
    <Stack
      sx={{
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
        p: 4,
        ".lf-player-container": {
          height: 300,
          overflow: "hidden",
          margin: "auto",
        },
      }}
    >
      <LottiePlayer
        id="done-lottie"
        src="/lottie/giveaway/data.json"
        style={{ height: "100%" }}
      />
      <Typography
        level="h3"
        component="div"
        sx={{ textAlign: "center", my: 2 }}
      >
        The project has been updated at:
      </Typography>
      <Typography sx={{ textAlign: "center", mb: 2 }}>{directory}</Typography>
      <Button
        onClick={() => {
          onDone();
          setDirectory("");
        }}
      >
        Take me Home
      </Button>
    </Stack>
  );
}
