import { useAtom } from "jotai";
import {
  directoryAtom,
  imagesAtom,
  projectAtom,
  selectedImageAtom,
} from "@/ions/atoms";
import { useColumns, useScrollbarWidth } from "@/ions/hooks";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  ButtonGroup,
  CircularProgress,
  FormControl,
  FormLabel,
  Grid,
  IconButton,
  Input,
  Link,
  Modal,
  ModalDialog,
  Sheet,
  Stack,
  styled,
  Textarea,
  Tooltip,
  Typography,
} from "@mui/joy";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import AutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeGrid } from "react-window";
import ImageIcon from "@mui/icons-material/Image";
import SettingsIcon from "@mui/icons-material/Settings";
import StyleIcon from "@mui/icons-material/Style";
import VisibilityIcon from "@mui/icons-material/Visibility";
import {
  GPT_VISION_OPTIONS,
  OPENAI_API_KEY,
} from "../../../main/helpers/constants";
import WarningIcon from "@mui/icons-material/Warning";
import dynamic from "next/dynamic";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

const CodeMirror = dynamic(
  () => import("react-codemirror2").then((module_) => module_.Controlled),
  { ssr: false },
);
const StyledEditor = styled(CodeMirror)({
  height: "100%",
  ">.CodeMirror": {
    height: "100%",
  },
});
export function Cell({ columnIndex, rowIndex, style }) {
  const [images] = useAtom(imagesAtom);
  const [selectedImage, setSelectedImage] = useAtom(selectedImageAtom);
  const columnCount = useColumns({ xs: 2, sm: 3, md: 4, lg: 6 });
  const index = rowIndex * columnCount + columnIndex;
  const image = images[index];
  return (
    <Box style={style}>
      {image && (
        <Button
          color={selectedImage === image ? "primary" : "neutral"}
          variant={selectedImage === image ? "solid" : "plain"}
          sx={{ p: 1 }}
          onClick={() => {
            setSelectedImage(image);
          }}
        >
          <img
            src={`my://${image.image}`}
            alt={""}
            style={{
              aspectRatio: 1,
              width: "100%",
              height: "auto",
              objectFit: "contain",
            }}
          />
        </Button>
      )}
    </Box>
  );
}

function CaptionModal({
  open,
  onClose,
  onStart,
  onDone,
}: {
  onClose(): void | Promise<void>;
  onStart(): void | Promise<void>;
  onDone(): void | Promise<void>;
  open?: boolean;
}) {
  const [openAiApiKey, setOpenAiApiKey] = useState("");
  const [gptVisionOptions, setGptVisionOptions] = useState({
    batchSize: 10,
    guidelines: `Please caption these images, separate groups by comma, ensure logical groups: "black torn wide pants" instead of "black, torn, wide pants"`,
    exampleResponse: `[
  "a photo of a young man, red hair, blue torn overalls, white background",
  "a watercolor painting of an elderly woman, grey hair, floral print sundress, pink high heels, looking at a castle in the distance"
]`,
  });
  const [showKey, setShowKey] = useState(false);
  const [confirmGpt, setConfirmGpt] = useState(false);
  const [showGptOptions, setShowGptOptions] = useState(false);

  useEffect(() => {
    // Request the API key
    window.ipc.send(`${OPENAI_API_KEY}:get`);

    // Listener for the apiKey response
    window.ipc.on(OPENAI_API_KEY, (key) => {
      if (key) {
        setOpenAiApiKey(key as string);
      }
    });
  }, []);

  useEffect(() => {
    // Request the API key
    window.ipc.send(`${GPT_VISION_OPTIONS}:get`);

    // Listener for the apiKey response
    window.ipc.on(GPT_VISION_OPTIONS, (options) => {
      if (options) {
        setGptVisionOptions(
          options as {
            batchSize: number;
            guidelines: string;
            exampleResponse: string;
          },
        );
      }
    });
  }, []);

  const [directory] = useAtom(directoryAtom);
  return (
    <Modal keepMounted open={open} onClose={onClose}>
      <ModalDialog sx={{ width: 600, overflow: "auto" }}>
        <Typography sx={{ pr: 2 }}>Choose a Captioning Method:</Typography>
        <Stack spacing={2}>
          <ButtonGroup variant="solid" sx={{ width: "100%" }}>
            <Button
              startDecorator={<ImageIcon />}
              sx={{ flex: 1 }}
              onClick={async () => {
                onStart();
                onClose();
                await window.ipc.handleRunBlip(directory);
                onDone();
              }}
            >
              Generate Captions with BLIP
            </Button>
            <Tooltip disableInteractive title="BLIP Settings">
              <IconButton disabled>
                <SettingsIcon />
              </IconButton>
            </Tooltip>
          </ButtonGroup>
          <ButtonGroup variant="solid" sx={{ width: "100%" }}>
            <Button
              startDecorator={<StyleIcon />}
              sx={{ flex: 1 }}
              onClick={async () => {
                onStart();
                onClose();
                await window.ipc.handleRunWd14(directory);
                onDone();
              }}
            >
              Generate Tags with WD14
            </Button>
            <Tooltip disableInteractive title="WD14 Settings">
              <IconButton disabled>
                <SettingsIcon />
              </IconButton>
            </Tooltip>
          </ButtonGroup>
          <ButtonGroup variant="solid" sx={{ width: "100%" }}>
            <Button
              color="warning"
              startDecorator={<VisibilityIcon />}
              sx={{ flex: 1 }}
              onClick={async () => {
                setConfirmGpt(!confirmGpt);
              }}
            >
              Custom Captions with GPT-Vision
            </Button>
            <Tooltip disableInteractive title={"GPT-Vision Settings"}>
              <IconButton
                onClick={() => {
                  setShowGptOptions(!showGptOptions);
                }}
              >
                <SettingsIcon />
              </IconButton>
            </Tooltip>
          </ButtonGroup>
          {confirmGpt && (
            <Stack spacing={2}>
              <Alert color={"warning"} startDecorator={<WarningIcon />}>
                <Typography>
                  Attention: Using GPT-Vision will send your images to OpenAI.
                  Please comply with OpenAI's{" "}
                  <Link
                    href="https://openai.com/policies/terms-of-use"
                    target="_blank"
                  >
                    Terms of use
                  </Link>
                </Typography>
              </Alert>
              {!openAiApiKey && (
                <Typography>
                  Enter your OpenAI API key to use GPT-Vision.{" "}
                  <Link
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                  >
                    Get an API key here.
                  </Link>
                </Typography>
              )}
              <Button
                disabled={!openAiApiKey}
                color="danger"
                startDecorator={<VisibilityIcon />}
                sx={{ flex: 1 }}
                onClick={async () => {
                  onStart();
                  onClose();
                  await window.ipc.handleRunGPTV(directory, gptVisionOptions);
                  onDone();
                }}
              >
                Proceed with GPT-Vision
              </Button>
            </Stack>
          )}
          {showGptOptions && (
            <Box>
              <FormControl sx={{ my: 1 }}>
                <FormLabel>OpenAI API key</FormLabel>
                <Input
                  type={showKey ? "text" : "password"}
                  value={openAiApiKey}
                  endDecorator={
                    <IconButton
                      aria-label={showKey ? "Hide Key" : "Show Key"}
                      onClick={() => {
                        setShowKey(!showKey);
                      }}
                    >
                      {showKey ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  }
                  onChange={(event) => {
                    setOpenAiApiKey(event.target.value);
                  }}
                  onBlur={() => {
                    window.ipc.store({
                      [OPENAI_API_KEY]: openAiApiKey,
                    });
                  }}
                />
              </FormControl>
              <Typography sx={{ my: 1 }}>Guidelines</Typography>
              <Box sx={{ height: 200 }}>
                <StyledEditor
                  value={gptVisionOptions.guidelines}
                  options={{
                    mode: "markdown",
                    theme: "material",
                    lineWrapping: true,
                  }}
                  onBeforeChange={(editor, data, value) => {
                    setGptVisionOptions({
                      ...gptVisionOptions,
                      guidelines: value,
                    });
                    window.ipc.store({
                      [GPT_VISION_OPTIONS]: {
                        ...gptVisionOptions,
                        guidelines: value,
                      },
                    });
                  }}
                />
              </Box>
              <Typography sx={{ my: 1 }}>Example Response</Typography>
              <Box sx={{ height: 200 }}>
                <StyledEditor
                  value={gptVisionOptions.exampleResponse}
                  options={{
                    mode: "application/ld+json",
                    theme: "material",
                    lineWrapping: true,
                  }}
                  onBeforeChange={(editor, data, value) => {
                    setGptVisionOptions({
                      ...gptVisionOptions,
                      exampleResponse: value,
                    });
                    window.ipc.store({
                      [GPT_VISION_OPTIONS]: {
                        ...gptVisionOptions,
                        exampleResponse: value,
                      },
                    });
                  }}
                />
              </Box>
            </Box>
          )}
        </Stack>
      </ModalDialog>
    </Modal>
  );
}

export function ProjectView({ onDone }: { onDone(): void }) {
  const [images, setImages] = useAtom(imagesAtom);
  const columnCount = useColumns({ xs: 2, sm: 3, md: 4, lg: 6 });
  const scrollbarWidth = useScrollbarWidth();
  const [selectedImage, setSelectedImage] = useAtom(selectedImageAtom);
  const [project] = useAtom(projectAtom);

  const [captionModalOpen, setCaptionModalOpen] = useState(false);
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(false);

  function saveCaptionToFile() {
    if (selectedImage) {
      window.ipc.saveCaption({ ...selectedImage, caption });
      setSelectedImage({ ...selectedImage, caption });
      setImages(
        images.map((image_) => {
          return image_.image === selectedImage.image
            ? { ...image_, caption }
            : image_;
        }),
      );
    }
  }

  const goToPrevious = useCallback(() => {
    if (selectedImage) {
      const currentIndex = images.findIndex(
        (image_) => image_.image === selectedImage.image,
      );
      if (currentIndex > 0) {
        setSelectedImage(images[currentIndex - 1]);
      } else {
        setSelectedImage(images[images.length - 1]);
      }
    }
  }, [selectedImage]);
  const goToNext = useCallback(() => {
    if (selectedImage) {
      const currentIndex = images.findIndex(
        (image_) => image_.image === selectedImage.image,
      );
      if (currentIndex < images.length - 1) {
        setSelectedImage(images[currentIndex + 1]);
      } else {
        setSelectedImage(images[0]);
      }
    }
  }, [selectedImage]);

  useEffect(() => {
    const image_ = images[0];
    if (image_) {
      setSelectedImage(image_);
      setCaption(image_.caption ?? "");
    }
  }, [images]);

  useEffect(() => {
    if (selectedImage) {
      setCaption(selectedImage.caption ?? "");
    }
  }, [selectedImage]);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.altKey) {
        switch (event.key) {
          case "ArrowLeft": {
            goToPrevious();
            break;
          }
          case "ArrowRight": {
            goToNext();
            break;
          }
          default: {
            break;
          }
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [goToPrevious, goToNext]);

  return (
    <Box sx={{ display: "flex", flex: 1 }}>
      <Grid
        container
        spacing={2}
        columns={{ xs: 1, md: 2 }}
        sx={{ overflow: "hidden", width: "100%" }}
      >
        <Grid xs={1} sx={{ display: "flex" }}>
          <Box sx={{ flex: 1, width: "100%", position: "relative" }}>
            <Box
              sx={{
                inset: 0,
                position: "absolute",
                overflow: "hidden",
                ".react-transform-wrapper, .react-transform-component": {
                  height: "100%",
                  width: "100%",
                },
              }}
            >
              {selectedImage && (
                <Box
                  sx={{ position: "relative", height: "100%", width: "100%" }}
                >
                  <IconButton
                    variant="solid"
                    sx={{
                      position: "absolute",
                      top: "50%",
                      left: 0,
                      zIndex: 2,
                      transform: "translateY(-50%)",
                    }}
                    onClick={goToPrevious}
                  >
                    <ChevronLeftIcon />
                  </IconButton>
                  <IconButton
                    variant="solid"
                    sx={{
                      position: "absolute",
                      top: "50%",
                      right: 0,
                      zIndex: 2,
                      transform: "translateY(-50%)",
                    }}
                    onClick={goToNext}
                  >
                    <ChevronRightIcon />
                  </IconButton>
                  <TransformWrapper>
                    <TransformComponent>
                      <img
                        src={`my://${selectedImage.image}`}
                        alt={""}
                        style={{
                          flex: 1,
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                        }}
                      />
                    </TransformComponent>
                  </TransformWrapper>
                </Box>
              )}
            </Box>
          </Box>
        </Grid>
        <Grid xs={1} sx={{ display: "flex" }}>
          <Stack sx={{ flex: 1 }}>
            <Box sx={{ pb: 2 }}>
              <Sheet
                sx={{
                  p: 1,
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 1,
                }}
              >
                <Button
                  startDecorator={
                    loading ? <CircularProgress /> : <AutoAwesomeIcon />
                  }
                  onClick={() => {
                    setCaptionModalOpen(true);
                  }}
                >
                  Auto Caption
                </Button>
                <Button startDecorator={<DoneAllIcon />} onClick={onDone}>
                  Done
                </Button>
              </Sheet>
              <FormControl>
                <FormLabel>Caption</FormLabel>
                <Textarea
                  minRows={3}
                  value={caption}
                  onChange={(event) => setCaption(event.target.value)}
                  onBlur={() => {
                    saveCaptionToFile();
                  }}
                />
              </FormControl>
            </Box>
            <Box sx={{ flex: 1 }}>
              <AutoSizer>
                {({ height, width }) => {
                  const innerWidth = width - scrollbarWidth;
                  // Use these actual sizes to calculate your percentage based sizes
                  const columnWidth = innerWidth / columnCount;

                  return (
                    <FixedSizeGrid
                      columnCount={columnCount}
                      columnWidth={columnWidth}
                      height={height}
                      rowCount={Math.ceil(images.length / columnCount)}
                      rowHeight={columnWidth}
                      width={width}
                    >
                      {Cell}
                    </FixedSizeGrid>
                  );
                }}
              </AutoSizer>
            </Box>
          </Stack>
        </Grid>
      </Grid>
      <CaptionModal
        open={captionModalOpen}
        onStart={() => {
          setLoading(true);
        }}
        onDone={async () => {
          if (project) {
            const content = await window.ipc.getExistingProject(project);
            setImages(content);
          }
          setLoading(false);
        }}
        onClose={() => {
          setCaptionModalOpen(false);
        }}
      />
    </Box>
  );
}
