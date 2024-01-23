import React, { ReactNode } from "react";
import { Box } from "@mui/joy";

export function Layout({ children }: { children?: ReactNode }) {
  return <Box sx={{ height: "100dvh", overflow: "hidden" }}>{children}</Box>;
}
