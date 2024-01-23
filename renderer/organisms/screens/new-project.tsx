import React, { useState } from "react";
import {
  adjectives,
  colors,
  generateRandomName,
  nouns,
} from "@/ions/utils/get-random-name";
import { useAtom } from "jotai";
import { directoryAtom, imagesAtom, projectAtom } from "@/ions/atoms";
import {
  Button,
  FormControl,
  FormLabel,
  IconButton,
  Input,
  Stack,
  Typography,
} from "@mui/joy";
import FolderIcon from "@mui/icons-material/Folder";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import RefreshIcon from "@mui/icons-material/Refresh";
export function NewProject({ onDone }: { onDone(): void }) {
  const [name, setName] = useState(
    generateRandomName([adjectives, colors, nouns]),
  );
  const [, setProject] = useAtom(projectAtom);
  const [, setImages] = useAtom(imagesAtom);
  const [directory, setDirectory] = useAtom(directoryAtom);

  const [, setLoading] = useState(false);
  const [, setError] = useState<Error | null>(null);

  return (
    <Stack
      spacing={2}
      sx={{
        mx: "auto",
        alignItems: "center",
        alignContent: "center",
        justifyContent: "center",
        minWidth: 400,
      }}
    >
      <Typography level={"h3"} component={"div"}>
        Create a new Project
      </Typography>
      <FormControl sx={{ width: "100%" }}>
        <FormLabel>Name</FormLabel>
        <Input
          value={name}
          endDecorator={
            <IconButton
              aria-label="New random Name"
              onClick={async () => {
                setName(generateRandomName([adjectives, colors, nouns]));
              }}
            >
              <RefreshIcon />
            </IconButton>
          }
          onKeyDown={(event) => {
            const allowedKeys = /^[a-z0-9-]$/;
            const controlKeys = [
              "Backspace",
              "ArrowLeft",
              "ArrowRight",
              "ArrowUp",
              "ArrowDown",
              "Shift",
            ];

            if (
              !allowedKeys.test(event.key) &&
              !controlKeys.includes(event.key)
            ) {
              event.preventDefault();
            }
          }}
          onChange={(event) => {
            setName(event.target.value);
          }}
        />
      </FormControl>
      <FormControl sx={{ width: "100%" }}>
        <FormLabel>Directory</FormLabel>
        <Input
          value={directory}
          endDecorator={
            <IconButton
              aria-label="Select Source Directory"
              onClick={async () => {
                setLoading(true);
                try {
                  const directory_ = await window.ipc.getDirectory();
                  if (directory_) {
                    setDirectory(directory_);
                    await window.ipc.store({
                      directory: directory_,
                    });
                  }
                } catch (error) {
                  console.log(error);
                  setError(error);
                } finally {
                  setLoading(false);
                }
              }}
            >
              <FolderIcon />
            </IconButton>
          }
          onChange={(event) => {
            setDirectory(event.target.value);
          }}
        />
      </FormControl>

      <Button
        fullWidth
        disabled={!directory}
        size="lg"
        color="primary"
        endDecorator={<ArrowForwardIcon />}
        onClick={async () => {
          try {
            if (directory) {
              const content = await window.ipc.createImageCache(
                directory,
                name,
              );
              setImages(content.images);
              setProject(content.config);
              onDone();
            }
          } catch (error) {
            console.log(error);
            setError(error);
          } finally {
            setLoading(false);
          }
        }}
      >
        Continue
      </Button>
    </Stack>
  );
}
