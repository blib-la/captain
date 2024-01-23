import { Button } from "@mui/joy";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import React from "react";

export function OpenProject({ onDone }: { onDone(): void }) {
  return (
    <Button
      fullWidth
      color="neutral"
      variant="plain"
      startDecorator={<FolderOpenIcon />}
      onClick={onDone}
    >
      Open Project
    </Button>
  );
}
