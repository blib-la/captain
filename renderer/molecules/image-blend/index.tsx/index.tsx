import { ReactNode } from "react";
import { Box } from "@mui/joy";

export function ImageBlend({
  children,
  invert,
}: {
  children: ReactNode;
  invert?: boolean;
}) {
  return (
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        filter: `invert(${invert ? 0 : 1})`,
        mixBlendMode: invert ? "multiply" : "screen",
        "[data-joy-color-scheme='light'] &": {
          filter: `invert(${invert ? 1 : 0})`,
          mixBlendMode: invert ? "screen" : "multiply",
        },
      }}
    >
      {children}
    </Box>
  );
}
