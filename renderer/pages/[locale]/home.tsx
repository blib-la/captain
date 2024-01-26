import { useEffect, useState } from "react";
import Head from "next/head";
import { Box, Button, Grid, Sheet, Tooltip, Typography } from "@mui/joy";
import { InferGetStaticPropsType } from "next";
import { useAtom } from "jotai";
import { directoryAtom, imagesAtom, projectsAtom } from "@/ions/atoms";
import { useTranslation } from "next-i18next";
import AddToPhotosIcon from "@mui/icons-material/AddToPhotos";
import Link from "next/link";
import { FolderDrop } from "@/organisms/folder-drop";
import { Lottie } from "@/organisms/lottie";
import { AddDatasetModal } from "@/organisms/modals/add-dataset";
import { StyledImage } from "@/atoms/image/styled";
import { DeleteConfirm } from "@/organisms/delete-confirm";
import { CustomScrollbars } from "@/organisms/custom-scrollbars";
import { getStaticPaths, makeStaticProps } from "@/ions/i18n/getStatic";

export default function Page(
  _properties: InferGetStaticPropsType<typeof getStaticProps>,
) {
  const [datasets, setDatasets] = useAtom(projectsAtom);
  const [, setImages] = useAtom(imagesAtom);
  const [, setDirectory] = useAtom(directoryAtom);
  const {
    t,
    i18n: { language: locale },
  } = useTranslation(["common"]);
  const [newDatasetOpen, setNewDatasetOpen] = useState(false);

  function handleCloseNewDataset() {
    setNewDatasetOpen(false);
  }
  function handleOpenNewDataset() {
    setNewDatasetOpen(true);
  }

  useEffect(() => {
    window.ipc.getProjects().then((datasets_) => {
      setDatasets(datasets_);
    });
  }, [setDatasets]);

  useEffect(() => {
    setImages([]);
  }, [setImages]);

  return (
    <>
      <Head>
        <title>{`Captain | ${t("common:datasets")}`}</title>
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
            px: 1,
            height: 44,
            zIndex: 1,
          }}
        >
          <Typography level="h4" component="h1">
            {t("common:datasets")}
          </Typography>
          <Box sx={{ flex: 1 }} />
          <Button
            color="primary"
            size="sm"
            startDecorator={<AddToPhotosIcon />}
            onClick={handleOpenNewDataset}
          >
            {t("common:new")}
          </Button>
          <AddDatasetModal
            open={newDatasetOpen}
            onClose={handleCloseNewDataset}
          />
        </Sheet>
        <Box sx={{ flex: 1, position: "relative" }}>
          <Box sx={{ position: "absolute", inset: 0 }}>
            <FolderDrop
              onDrop={(path) => {
                setDirectory(path);
                handleOpenNewDataset();
              }}
            >
              {Boolean(datasets.length) ? (
                <CustomScrollbars>
                  <Grid
                    container
                    spacing={1}
                    columns={{ xs: 2, sm: 3, md: 4, lg: 6, xl: 8 }}
                    sx={{
                      alignContent: "flex-start",
                      mx: 0,
                      my: 2,
                    }}
                  >
                    {datasets?.map((dataset) => {
                      return (
                        <Grid
                          key={dataset.id}
                          xs={1}
                          sx={{
                            display: "flex",
                            position: "relative",
                            ".delete-confirm": { opacity: 0 },
                            ".delete-confirm:focus": { opacity: 1 },
                            "&:hover .delete-confirm": { opacity: 1 },
                          }}
                        >
                          <DeleteConfirm projectId={dataset.id} />

                          <Tooltip title={dataset.name}>
                            <Box>
                              <Link
                                legacyBehavior
                                passHref
                                href={{
                                  pathname: `/${locale}/dataset`,
                                  query: { id: dataset.id },
                                }}
                              >
                                <Button
                                  component="a"
                                  sx={{
                                    flex: 1,
                                    display: "flex",
                                    flexDirection: "column",
                                    position: "relative",
                                  }}
                                >
                                  <StyledImage
                                    src={`my://${dataset.files}/${dataset.cover}`}
                                    alt=""
                                    height={1024}
                                    width={1024}
                                  />
                                </Button>
                              </Link>
                            </Box>
                          </Tooltip>
                        </Grid>
                      );
                    })}
                  </Grid>
                </CustomScrollbars>
              ) : (
                <Box
                  sx={{
                    overflowX: "hidden",
                    overflowY: "auto",
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Box
                    sx={{
                      width: "max-content",
                    }}
                  >
                    <Lottie
                      path="/lottie/minimalistic/welcome.json"
                      height={400}
                    />
                    <Typography level="h2" sx={{ textAlign: "center" }}>
                      {t("common:noDatasets")}
                    </Typography>
                    <Typography sx={{ textAlign: "center" }}>
                      {t("common:pages.datasets.dropToAdd")}
                    </Typography>
                  </Box>
                </Box>
              )}
            </FolderDrop>
          </Box>
        </Box>
      </Box>
    </>
  );
}

const getStaticProps = makeStaticProps(["common"]);
export { getStaticPaths, getStaticProps };
