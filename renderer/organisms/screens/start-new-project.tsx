import { Button } from "@mui/joy";
import AddIcon from "@mui/icons-material/Add";
import React from "react";

export function StartNewProject({ onDone }: { onDone(): void }) {
  return (
    <Button
      fullWidth
      size="lg"
      color="primary"
      startDecorator={<AddIcon />}
      onClick={onDone}
    >
      Start New Project
    </Button>
  );
}
