import React, { useCallback, useEffect, useRef, useState } from "react";
import Head from "next/head";
import {
  Alert,
  Badge,
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
  ModalClose,
  ModalDialog,
  Sheet,
  Stack,
  styled,
  Textarea,
  Tooltip,
  Typography,
} from "@mui/joy";
import { Layout } from "@/organisms/layout";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { GetStaticPropsContext, InferGetStaticPropsType } from "next";
import { useRouter } from "next/router";
import { useAtom } from "jotai";
import {
  directoryAtom,
  imagesAtom,
  projectAtom,
  selectedImageAtom,
} from "@/ions/atoms";
import { useColumns } from "@/ions/hooks";
import AutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeGrid } from "react-window";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import {
  ReactZoomPanPinchContentRef,
  TransformComponent,
  TransformWrapper,
} from "react-zoom-pan-pinch";
import { ScreenReaderOnly } from "@/atoms/screen-reader-only";
import { Trans, useTranslation } from "next-i18next";
import {
  FOLDER,
  GPT_VISION_OPTIONS,
  OPENAI_API_KEY,
} from "../../main/helpers/constants";
import PhotoFilterIcon from "@mui/icons-material/PhotoFilter";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import {
  CustomScrollbars,
  CustomScrollbarsVirtualList,
} from "@/organisms/custom-scrollbars";
import ImageIcon from "@mui/icons-material/Image";
import SettingsIcon from "@mui/icons-material/Settings";
import StyleIcon from "@mui/icons-material/Style";
import VisibilityIcon from "@mui/icons-material/Visibility";
import WarningIcon from "@mui/icons-material/Warning";
import dynamic from "next/dynamic";
import { PasswordField } from "@/pages/settings";

export const CodeMirror = dynamic(
  () => import("react-codemirror2").then((module_) => module_.Controlled),
  { ssr: false },
);

export function Cell({ columnIndex, rowIndex, style }) {
  const ref = useRef<HTMLDivElement>(null);
  const [images] = useAtom(imagesAtom);
  const [selectedImage, setSelectedImage] = useAtom(selectedImageAtom);
  const columnCount = useColumns({ xs: 2, sm: 3, md: 4, lg: 6 });
  const { t } = useTranslation(["common"]);
  const index = rowIndex * columnCount + columnIndex;
  const image = images[index];

  return (
    <Box ref={ref} style={style}>
      {image && (
        <Badge
          color={image.caption ? "success" : "danger"}
          anchorOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
          sx={{ mt: 1.5, mr: 1.5 }}
        >
          <Button
            color={selectedImage === index ? "primary" : "neutral"}
            variant={selectedImage === index ? "solid" : "plain"}
            sx={{ p: 1, position: "relative" }}
            onClick={() => {
              setSelectedImage(index);
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
            <ScreenReaderOnly>
              {t("common:pages.dataset.selectImage")}
            </ScreenReaderOnly>
          </Button>
        </Badge>
      )}
    </Box>
  );
}

function Controls({
  zoomIn,
  zoomOut,
  resetTransform,
}: ReactZoomPanPinchContentRef) {
  const { t } = useTranslation(["common"]);
  return (
    <Sheet sx={{ p: 0.5 }}>
      <ButtonGroup variant="soft" size="sm">
        <IconButton
          aria-label={t("common:zoomIn")}
          onClick={() => {
            zoomIn();
          }}
        >
          <ZoomInIcon />
        </IconButton>
        <IconButton
          aria-label={t("common:zoomOut")}
          onClick={() => {
            zoomOut();
          }}
        >
          <ZoomOutIcon />
        </IconButton>
        <IconButton
          aria-label={t("resetTransform:zoomIn")}
          onClick={() => {
            resetTransform();
          }}
        >
          <SearchOffIcon />
        </IconButton>
      </ButtonGroup>
    </Sheet>
  );
}
export function BigImage() {
  const [images] = useAtom(imagesAtom);
  const [selectedImage, setSelectedImage] = useAtom(selectedImageAtom);
  const { t } = useTranslation(["common"]);
  return (
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
      {images[selectedImage] && (
        <Box sx={{ position: "relative", height: "100%", width: "100%" }}>
          <TransformWrapper
            wheel={{
              step: 0.001,
              smoothStep: 0.001,
            }}
          >
            {(utils) => (
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                }}
              >
                <Controls {...utils} />
                <Box
                  sx={{
                    position: "absolute",
                    top: 40,
                    left: 0,
                    right: 0,
                    bottom: 0,
                  }}
                >
                  <IconButton
                    variant="solid"
                    aria-label={t("common:previous")}
                    sx={{
                      position: "absolute",
                      top: "50%",
                      left: 4,
                      zIndex: 2,
                      transform: "translateY(-50%)",
                    }}
                    onClick={() => {
                      setSelectedImage(
                        (images.length + selectedImage - 1) % images.length,
                      );
                      utils.resetTransform();
                    }}
                  >
                    <ChevronLeftIcon />
                  </IconButton>
                  <IconButton
                    variant="solid"
                    aria-label={t("common:next")}
                    sx={{
                      position: "absolute",
                      top: "50%",
                      right: 4,
                      zIndex: 2,
                      transform: "translateY(-50%)",
                    }}
                    onClick={() => {
                      setSelectedImage((selectedImage + 1) % images.length);
                      utils.resetTransform();
                    }}
                  >
                    <ChevronRightIcon />
                  </IconButton>
                  <TransformComponent>
                    <img
                      src={`my://${images[selectedImage].image}`}
                      alt={""}
                      style={{
                        flex: 1,
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                      }}
                    />
                  </TransformComponent>
                </Box>
              </Box>
            )}
          </TransformWrapper>
        </Box>
      )}
    </Box>
  );
}

export const StyledEditor = styled(CodeMirror)({
  height: "100%",
  ">.CodeMirror": {
    height: "100%",
  },
});
export function CaptionModal({
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
  const [confirmGpt, setConfirmGpt] = useState(false);
  const [showGptOptions, setShowGptOptions] = useState(false);
  const [directory] = useAtom(directoryAtom);
  const { t } = useTranslation(["common"]);

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

  return (
    <Modal keepMounted open={open} onClose={onClose}>
      <ModalDialog
        sx={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          pt: 6,
        }}
      >
        <ModalClose aria-label={t("common:close")} />
        <Typography sx={{ pr: 2 }}>Choose a Captioning Method:</Typography>
        <CustomScrollbars style={{ flex: 1 }}>
          <Stack
            spacing={2}
            sx={{
              minHeight: "100%",
              justifyContent: "center",
              width: 600,
              mx: "auto",
            }}
          >
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
                {t("common:pages.dataset.generateCaptionWithBLIP")}
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
                {t("common:pages.dataset.generateTagsWithWD14")}
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
                {t("common:pages.dataset.customCaptionsWithGPTVision")}
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
                    <Trans
                      i18nKey="common:pages.dataset.warningOpenAI"
                      components={{
                        1: (
                          <Link
                            href="https://openai.com/policies/terms-of-use"
                            target="_blank"
                          />
                        ),
                      }}
                    />
                  </Typography>
                </Alert>
                {!openAiApiKey && (
                  <Typography>
                    {t("common:pages.dataset.enterKeyToUseGPTVision")}{" "}
                    <Link
                      href="https://platform.openai.com/api-keys"
                      target="_blank"
                    >
                      {t("common:getApiKey")}
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
                  {t("common:pages.dataset.proceedWithGPTVision")}
                </Button>
              </Stack>
            )}
            {showGptOptions && (
              <Box>
                <PasswordField
                  fullWidth
                  aria-label={t("common:openAiApiKey")}
                  label={t("common:openAiApiKey")}
                  value={openAiApiKey}
                  onChange={(event) => {
                    setOpenAiApiKey(event.target.value);
                  }}
                  onBlur={() => {
                    window.ipc.store({
                      [OPENAI_API_KEY]: openAiApiKey,
                    });
                  }}
                />
                <Typography sx={{ my: 1 }}>{t("common:guideline")}</Typography>
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
                <Typography sx={{ my: 1 }}>
                  {t("common:exampleResponse")}
                </Typography>
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
        </CustomScrollbars>
      </ModalDialog>
    </Modal>
  );
}

export function useKeyboardControls({
  onBeforeChange,
}: {
  onBeforeChange(): Promise<void> | void;
}) {
  const [images] = useAtom(imagesAtom);
  const [selectedImage, setSelectedImage] = useAtom(selectedImageAtom);
  const columnCount = useColumns({ xs: 2, sm: 3, md: 4, lg: 6 });

  const goRowUp = useCallback(() => {
    if (selectedImage > columnCount - 1) {
      setSelectedImage(selectedImage - columnCount);
    } else {
      setSelectedImage(images.length - 1);
    }
  }, [selectedImage, columnCount, images]);

  const goRowDown = useCallback(() => {
    if (selectedImage < images.length - columnCount) {
      setSelectedImage(selectedImage + columnCount);
    } else {
      setSelectedImage(0);
    }
  }, [selectedImage, columnCount, images]);

  const goToPrevious = useCallback(() => {
    if (selectedImage > 0) {
      setSelectedImage(selectedImage - 1);
    } else {
      setSelectedImage(images.length - 1);
    }
  }, [selectedImage, images]);

  const goToNext = useCallback(() => {
    if (selectedImage < images.length - 1) {
      setSelectedImage(selectedImage + 1);
    } else {
      setSelectedImage(0);
    }
  }, [selectedImage, images]);

  useEffect(() => {
    async function handleKeyDown(event: KeyboardEvent) {
      if (event.altKey) {
        switch (event.key) {
          case "ArrowLeft": {
            await onBeforeChange();
            goToPrevious();
            break;
          }

          case "ArrowRight": {
            await onBeforeChange();
            goToNext();
            break;
          }
          case "ArrowUp": {
            await onBeforeChange();
            goRowUp();
            break;
          }
          case "ArrowDown": {
            await onBeforeChange();
            goRowDown();
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
  }, [goToPrevious, goToNext, goRowUp, goRowUp, columnCount, onBeforeChange]);
}
export default function Page(
  _properties: InferGetStaticPropsType<typeof getStaticProps>,
) {
  const { query } = useRouter();
  const id = query.id as string;
  const [images, setImages] = useAtom(imagesAtom);
  const [selectedImage, setSelectedImage] = useAtom(selectedImageAtom);
  const [dataset, setDataset] = useAtom(projectAtom);
  const columnCount = useColumns({ xs: 2, sm: 3, md: 4, lg: 6 });
  const [caption, setCaption] = useState("");
  const [name, setName] = useState("");
  const { t } = useTranslation(["common"]);
  const [captionModalOpen, setCaptionModalOpen] = useState(false);
  const [captionLoading, setCaptionLoading] = useState(false);
  const [, setDirectory] = useAtom(directoryAtom);

  const saveCaptionToFile = useCallback(async () => {
    const image = images[selectedImage];
    if (image) {
      await window.ipc.saveCaption({ ...image, caption });
      setImages(
        images.map((image_) => {
          return image_.image === image.image ? { ...image_, caption } : image_;
        }),
      );
    }
  }, [images, selectedImage, caption]);

  useKeyboardControls({ onBeforeChange: saveCaptionToFile });

  useEffect(() => {
    if (images[selectedImage]) {
      setCaption(images[selectedImage].caption ?? "");
    }
  }, [selectedImage, images]);

  useEffect(() => {
    if (id) {
      window.ipc.getDataset(id).then((dataset_) => {
        setDataset(dataset_.dataset);
        setImages(dataset_.images);
        setDirectory(dataset_.dataset.source);
      });
    }
  }, [id]);

  useEffect(() => {
    const image = images[selectedImage];
    if (image) {
      setCaption(image.caption ?? "");
    }
  }, [selectedImage, images]);

  useEffect(() => {
    setSelectedImage(0);
  }, []);

  useEffect(() => {
    if (dataset) {
      setName(dataset.name);
    }
  }, [dataset]);

  return (
    <Layout>
      <Head>
        <title>{`Captain | ${t("common:dataset")}`}</title>
      </Head>
      <CaptionModal
        open={captionModalOpen}
        onStart={() => {
          setCaptionLoading(true);
        }}
        onDone={async () => {
          if (dataset) {
            const content = await window.ipc.getExistingProject(dataset);
            setImages(content);
          }
          setCaptionLoading(false);
        }}
        onClose={() => {
          setCaptionModalOpen(false);
        }}
      />
      <Stack sx={{ position: "absolute", inset: 0 }}>
        <Sheet sx={{ p: 1, display: "flex", gap: 1 }}>
          <Box sx={{ flex: 1 }}>
            {dataset && (
              <Input
                fullWidth
                variant="plain"
                aria-label={t("common:datasetName")}
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                }}
                onBlur={async (event) => {
                  await window.ipc.updateDataset(dataset.id, {
                    name: event.target.value,
                  });
                }}
              />
            )}
          </Box>
          <Button
            startDecorator={<FolderOpenIcon />}
            onClick={() => {
              if (dataset) {
                window.ipc.send(`${FOLDER}:open`, dataset.source);
              }
            }}
          >
            {t("common:openFolder")}
          </Button>
          <Button
            startDecorator={
              captionLoading ? <CircularProgress /> : <PhotoFilterIcon />
            }
            onClick={() => {
              setCaptionModalOpen(true);
            }}
          >
            {t("common:autoCaption")}
          </Button>
        </Sheet>
        <Grid container spacing={2} columns={{ xs: 1, sm: 2 }} sx={{ flex: 1 }}>
          <Grid xs={1} sx={{ display: "flex" }}>
            <Box sx={{ position: "relative", flex: 1, height: "100%" }}>
              <BigImage />
            </Box>
          </Grid>
          <Grid xs={1} sx={{ display: "flex" }}>
            <Box sx={{ position: "relative", flex: 1 }}>
              <Stack spacing={2} sx={{ position: "absolute", inset: 0 }}>
                <Box>
                  <FormControl sx={{ pr: 1 }}>
                    <FormLabel>{t("common:caption")}</FormLabel>
                    <Textarea
                      minRows={3}
                      value={caption}
                      onChange={(event) => setCaption(event.target.value)}
                      onBlur={async () => {
                        await saveCaptionToFile();
                      }}
                    />
                  </FormControl>
                </Box>
                <Box
                  sx={{
                    position: "relative",
                    flex: 1,
                    ".react-window": {
                      WebkitOverflowScrolling: "touch",
                    },
                  }}
                >
                  <AutoSizer>
                    {({ height, width }) => {
                      const columnWidth = width / columnCount;

                      return (
                        <FixedSizeGrid
                          outerElementType={CustomScrollbarsVirtualList}
                          className="react-window"
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
            </Box>
          </Grid>
        </Grid>
      </Stack>
    </Layout>
  );
}

export async function getStaticProps(context: GetStaticPropsContext) {
  return {
    props: {
      ...(await serverSideTranslations(context.locale ?? "en", ["common"])),
    },
  };
}
