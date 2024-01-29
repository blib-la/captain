import {
  MouseEvent as ReactMouseEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { useTranslation } from "next-i18next";
import { useAtom } from "jotai";
import useSWR from "swr";
import { DOWNLOADS } from "../../../main/helpers/constants";
import { fetcher } from "@/ions/swr/fetcher";
import {
  Badge,
  Box,
  ButtonGroup,
  Card,
  CardContent,
  CircularProgress,
  Menu,
  MenuItem,
  Typography,
} from "@mui/joy";
import CheckIcon from "@mui/icons-material/Check";
import IconButton from "@mui/joy/IconButton";
import LinkIcon from "@mui/icons-material/Link";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import { ClickAwayListener } from "@mui/base";
import Button from "@mui/joy/Button";
import DownloadIcon from "@mui/icons-material/Download";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { checkpointsAtom } from "@/ions/atoms";

export const architectureMap = {
  "sd-2-1": "SD 2.1",
  "sd-xl-turbo": "SDXL Turbo",
  "sd-turbo": "SD Turbo",
  "sd-1-5": "SD 1.5",
  "sd-xl-1-0": "SDXL",
};

export function ModelCard({
  id,
  title,
  author,
  caption,
  files,
  type,
  license,
  architecture,
  link,
  image,
}: {
  id: string;
  author: string;
  license: string;
  link: string;
  type: string;
  caption?: string;
  architecture: string;
  files: Array<{ filename: string; variant: string }>;
  title: string;
  image: string;
}) {
  const [isDownloading, setIsDownloading] = useState(false);
  const { t } = useTranslation(["common"]);
  const [isDownloadOptionsOpen, setIsDownloadOptionsOpen] = useState(false);

  const anchorRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [checkpoints] = useAtom(checkpointsAtom);

  const selectedFile = files[selectedIndex];
  const installed =
    Boolean(selectedFile) && checkpoints.includes(selectedFile.filename);
  const hasVersion = files.some(({ filename }) =>
    checkpoints.includes(filename),
  );

  function handleMenuItemClick(
    event: ReactMouseEvent<HTMLElement, MouseEvent>,
    index: number,
  ) {
    setSelectedIndex(index);
    setIsDownloadOptionsOpen(false);
  }
  const storeKey = `${DOWNLOADS}.${id}.${selectedFile.filename}`;
  const { data } = useSWR(storeKey, fetcher, {
    refreshInterval: 1000,
  });

  useEffect(() => {
    setIsDownloading(Boolean(data));
  }, [data]);

  return (
    <Card color="neutral" variant="soft">
      <>
        <Box sx={{ pr: 3 }}>
          <Badge
            color="secondary"
            size="sm"
            invisible={!hasVersion}
            badgeContent={<CheckIcon />}
            anchorOrigin={{
              vertical: "top",
              horizontal: "left",
            }}
            slotProps={{
              badge: {
                sx: {
                  mt: -1,
                  borderRadius: 0,
                  boxShadow: "none",
                },
              },
            }}
          >
            <Typography noWrap level="title-lg">
              {title}
            </Typography>
          </Badge>
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
            variant="outlined"
            color="primary"
            invisible={!architectureMap[architecture]}
            badgeContent={architectureMap[architecture]}
            anchorOrigin={{
              vertical: "top",
              horizontal: "left",
            }}
            slotProps={{
              badge: {
                sx: {
                  transform: "none",

                  borderRadius: 0,
                  boxShadow: "none",
                },
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
                  disabled={installed || isDownloading || !selectedFile}
                  startDecorator={
                    isDownloading ? <CircularProgress /> : <DownloadIcon />
                  }
                  sx={{ flex: 1 }}
                  onClick={async () => {
                    setIsDownloading(true);
                    try {
                      await window.ipc.fetch(storeKey, {
                        method: "POST",
                        data: true,
                      });
                      await window.ipc.downloadModel(
                        type,
                        `${link}/resolve/main/${selectedFile.filename}?download=true`,
                        { id, storeKey },
                      );
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
