import { ReactNode, useState } from "react";
import Box from "@mui/joy/Box";

export function FolderDrop({
  children,
  onDrop,
}: {
  children?: ReactNode;
  onDrop?(path: string): void;
}) {
  const [dragCounter, setDragCounter] = useState(0);

  const isDragOver = dragCounter > 0;

  return (
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        bgcolor: isDragOver ? "background.surface" : "background.body",
        "&  *": {
          pointerEvents: isDragOver ? "none" : "auto",
        },
      }}
      onDragOver={(event) => {
        event.preventDefault();
      }}
      onDragEnter={(event) => {
        event.preventDefault();
        setDragCounter((previousState) => previousState + 1);
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        setDragCounter((previousState) => previousState - 1);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDragCounter(0);
        const folder = event.dataTransfer.items[0];
        if (folder.kind === "file" && folder.webkitGetAsEntry().isDirectory) {
          if (onDrop) {
            onDrop(folder.getAsFile().path);
          }
        }
      }}
    >
      {children}
    </Box>
  );
}
