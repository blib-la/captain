import Head from "next/head";
import {
  Badge,
  Box,
  ButtonGroup,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Link,
  Menu,
  MenuItem,
  Sheet,
  Typography,
} from "@mui/joy";
import { InferGetStaticPropsType } from "next";
import { useTranslation } from "next-i18next";
import { Lottie } from "@/organisms/lottie";
import { getStaticPaths, makeStaticProps } from "@/ions/i18n/getStatic";
import { CustomScrollbars } from "@/organisms/custom-scrollbars";
import Button from "@mui/joy/Button";
import IconButton from "@mui/joy/IconButton";
import LinkIcon from "@mui/icons-material/Link";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import {
  useEffect,
  useRef,
  useState,
  MouseEvent as ReactMouseEvent,
} from "react";
import useSWR from "swr";
import { MARKETPLACE_INDEX_DATA } from "../../../main/helpers/constants";
import DownloadIcon from "@mui/icons-material/Download";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { isEqual } from "lodash";
import { atom, useAtom } from "jotai";
import { usePollingEffect } from "@/ions/hooks/polling-effect";
import { useScrollPosition } from "@/ions/hooks/scroll-position";
import { ClickAwayListener } from "@mui/base";

const architectureMap = {
  "sd-2-1": "SD 2.1",
  "sd-xl-turbo": "SDXL Turbo",
  "sd-turbo": "SD Turbo",
  "sd-1-5": "SD 1.5",
  "sd-xl-1-0": "SDXL",
};
export function ModelCard({
  title,
  author,
  caption,
  files,
  license,
  architecture,
  link,
  image,
}: {
  author: string;
  license: string;
  link: string;
  caption?: string;
  architecture: string;
  files: Array<{ filename: string; variant: string }>;
  title: string;
  image: string;
}) {
  const [isDownloading, setIsDownloading] = useState(false);
  const { t } = useTranslation(["common"]);
  const [isDownloadOptionsOpen, setIsDownloadOptionsOpen] = useState(false);

  // const { data } = useSWR(
  //   `${DOWNLOADS}.${download.replace(/[:.\/]/g, "_")}`,
  //   fetcher,
  //   { refreshInterval: 1000 },
  // );

  // useEffect(() => {
  //   console.log(data);
  //   if (typeof data === "boolean") {
  //     setIsDownloading(data);
  //   }
  // }, [data, download]);
  const anchorRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(1);
  const [checkpoints] = useAtom(checkpointsAtom);

  const selectedFile = files[selectedIndex];
  const installed =
    Boolean(selectedFile) && checkpoints.includes(selectedFile.filename);

  function handleMenuItemClick(
    event: ReactMouseEvent<HTMLElement, MouseEvent>,
    index: number,
  ) {
    setSelectedIndex(index);
    setIsDownloadOptionsOpen(false);
  }

  return (
    <Card color="neutral" variant="soft">
      <>
        <Box sx={{ pr: 3 }}>
          <Typography noWrap level="title-lg">
            {title}
          </Typography>
          <Typography level="body-sm">{author}</Typography>
          <IconButton
            aria-label={title}
            component="a"
            href={link}
            target="_blank"
            variant="plain"
            color="neutral"
            size="sm"
            sx={{ position: "absolute", top: "0.875rem", right: "0.5rem" }}
          >
            <LinkIcon />
          </IconButton>
        </Box>
        <Box
          component="figure"
          sx={{ display: "flex", flexDirection: "column", m: 0, p: 0 }}
        >
          <Badge
            variant="solid"
            color="primary"
            invisible={!architectureMap[architecture]}
            badgeContent={architectureMap[architecture]}
            anchorOrigin={{
              vertical: "top",
              horizontal: "left",
            }}
            slotProps={{
              badge: {
                sx: { transform: "none", mt: 0.5, ml: 0.5, boxShadow: "none" },
              },
            }}
          >
            <Box
              component="img"
              src={`my://${image}`}
              loading="lazy"
              alt=""
              sx={{
                width: "100%",
                objectFit: "cover",
                aspectRatio: 1,
                bgcolor: "common.white",
              }}
            />
          </Badge>
          {caption && (
            <Typography
              level="body-md"
              sx={{
                mt: 1,
                WebkitLineClamp: 2,
                height: 48,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                display: "-webkit-box",
              }}
            >
              {caption}
            </Typography>
          )}
        </Box>
        <Typography
          noWrap
          level="body-sm"
          startDecorator={<WorkspacePremiumIcon />}
        >
          {license}
        </Typography>
        <CardContent>
          <ClickAwayListener
            onClickAway={() => {
              setIsDownloadOptionsOpen(false);
            }}
          >
            <Box>
              <ButtonGroup
                ref={anchorRef}
                size="md"
                variant="solid"
                color="primary"
                sx={{ width: "100%" }}
              >
                <Button
                  disabled={installed || isDownloading}
                  startDecorator={
                    isDownloading ? <CircularProgress /> : <DownloadIcon />
                  }
                  sx={{ flex: 1 }}
                  onClick={async () => {
                    setIsDownloading(true);
                    try {
                      // await window.ipc.fetch(
                      //   `${DOWNLOADS}.${download.replace(/[:.\/]/g, "_")}`,
                      //   { method: "POST", data: true },
                      // );
                      //await window.ipc.downloadModel(
                      //  fileType,
                      //  `${download}?download=true`,
                      //);
                    } catch (error) {
                      console.log(error);
                    } finally {
                      setIsDownloading(false);
                    }
                  }}
                >
                  {isDownloading
                    ? t("common:downloading")
                    : installed
                      ? t("common:installed")
                      : t("common:download")}
                </Button>
                {files.length > 1 && (
                  <IconButton
                    onClick={() => {
                      setIsDownloadOptionsOpen(!isDownloadOptionsOpen);
                    }}
                  >
                    <ArrowDropDownIcon />
                  </IconButton>
                )}
              </ButtonGroup>
              <Menu
                open={isDownloadOptionsOpen}
                onClose={() => {
                  setIsDownloadOptionsOpen(false);
                }}
                anchorEl={anchorRef.current}
              >
                {files.map((option, index) => (
                  <MenuItem
                    key={option.filename}
                    disabled={index === 2}
                    selected={index === selectedIndex}
                    onClick={(event) => handleMenuItemClick(event, index)}
                  >
                    {option.filename} ({option.variant})
                  </MenuItem>
                ))}
              </Menu>
            </Box>
          </ClickAwayListener>
        </CardContent>
      </>
    </Card>
  );
}

const checkpointsAtom = atom<string[]>([]);

export default function Page(
  _properties: InferGetStaticPropsType<typeof getStaticProps>,
) {
  const { t } = useTranslation(["common"]);
  const [, setCheckpoints] = useAtom(checkpointsAtom);
  const [stableDiffusionModels, setStableDuiffusionModels] = useState([]);
  const scrollRef = useRef<HTMLDivElement>();
  const scrollPosition = useScrollPosition(scrollRef);

  const { data: marketPlaceData } = useSWR(MARKETPLACE_INDEX_DATA);

  useEffect(() => {
    if (marketPlaceData) {
      setStableDuiffusionModels(
        Object.values(marketPlaceData["stable-diffusion"].checkpoints),
      );
    }
  }, [marketPlaceData]);

  usePollingEffect(
    () => {
      window.ipc.getModels("checkpoint").then((models) => {
        setCheckpoints((previousState) =>
          isEqual(previousState, models) ? previousState : models,
        );
      });
    },
    { interval: 2000, initialInterval: 100, initialCount: 3 },
  );

  return (
    <>
      <Head>
        <title>{`Captain | ${t("common:marketplace")}`}</title>
      </Head>
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <Sheet
          sx={{
            position: "sticky",
            top: 0,
            display: "flex",
            alignItems: "center",
            height: 44,
            px: 2,
            zIndex: 1,
          }}
        >
          <Typography level="h4" component="h1">
            {t("common:marketplace")}
          </Typography>
          <Box sx={{ flex: 1 }} />
        </Sheet>
        <Box sx={{ flex: 1, position: "relative" }}>
          <CustomScrollbars>
            <Box
              sx={{
                backgroundSize: "100% 100%",
                bgcolor: "common.white",
                "[data-joy-color-scheme='light'] &": {
                  bgcolor: "common.black",
                },
              }}
            >
              <Lottie
                invert
                path="/lottie/minimalistic/e-commerce.json"
                height={400}
              />
            </Box>
            <Container sx={{ py: 2 }}>
              <Box
                sx={{ py: 2, display: "flex", justifyContent: "space-between" }}
              >
                <Typography level="h2">Stable Diffusion</Typography>
                <Link>{t("common:seeAll")}</Link>
              </Box>
              <Box sx={{ position: "relative" }}>
                <Box
                  sx={{
                    position: "absolute",
                    zIndex: 2,
                    inset: 0,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    alignContent: "center",
                    visibility: "hidden",
                    pointerEvents: "none",
                  }}
                >
                  <IconButton
                    variant="solid"
                    sx={{
                      visibility:
                        scrollPosition.scrollable && !scrollPosition.start
                          ? "visible"
                          : "hidden",
                      pointerEvents: "all",
                    }}
                    onClick={() => {
                      if (scrollRef.current) {
                        // Scroll one full width of the scrollRef Element to the left
                        scrollRef.current.scrollBy({
                          left: -scrollRef.current.clientWidth,
                          behavior: "smooth",
                        });
                      }
                    }}
                  >
                    <ChevronLeftIcon />
                  </IconButton>
                  <IconButton
                    variant="solid"
                    sx={{
                      visibility:
                        scrollPosition.scrollable && !scrollPosition.end
                          ? "visible"
                          : "hidden",
                      pointerEvents: "all",
                    }}
                    onClick={() => {
                      if (scrollRef.current) {
                        // Scroll one full width of the scrollRef Element to the right
                        scrollRef.current.scrollBy({
                          left: scrollRef.current.clientWidth,
                          behavior: "smooth",
                        });
                      }
                    }}
                  >
                    <ChevronRightIcon />
                  </IconButton>
                </Box>

                <Box
                  ref={scrollRef}
                  sx={{
                    display: "flex",
                    overflow: "auto",
                    mx: -1,
                    scrollSnapType: "x mandatory",
                  }}
                >
                  {stableDiffusionModels.map((stableDiffusionModel) => {
                    return (
                      <Box
                        key={stableDiffusionModel.id}
                        sx={{
                          display: "flex",
                          scrollSnapAlign: "start",
                          width: {
                            xs: "100%",
                            sm: "calc(100% / 2)",
                            md: "calc(100% / 3)",
                            lg: "calc(100% / 4)",
                          },
                          flexShrink: 0,
                          px: 1,
                        }}
                      >
                        <ModelCard
                          title={stableDiffusionModel.info.title}
                          author={stableDiffusionModel.info.author}
                          link={stableDiffusionModel.info.link}
                          image={stableDiffusionModel.preview}
                          license={stableDiffusionModel.info.license}
                          files={stableDiffusionModel.info.files}
                          architecture={stableDiffusionModel.info.architecture}
                        />
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            </Container>
          </CustomScrollbars>
        </Box>
      </Box>
    </>
  );
}

const getStaticProps = makeStaticProps(["common"]);
export { getStaticPaths, getStaticProps };
