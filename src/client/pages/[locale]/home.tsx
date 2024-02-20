import AddToPhotosIcon from "@mui/icons-material/AddToPhotos";
import Box from "@mui/joy/Box";
import Button from "@mui/joy/Button";
import Grid from "@mui/joy/Grid";
import LinearProgress from "@mui/joy/LinearProgress";
import Sheet from "@mui/joy/Sheet";
import Tooltip from "@mui/joy/Tooltip";
import Typography from "@mui/joy/Typography";
import { useAtom } from "jotai";
import type { InferGetStaticPropsType } from "next";
import Head from "next/head";
import Link from "next/link";
import { useTranslation } from "next-i18next";
import { useEffect, useState } from "react";
import useSWR from "swr";

import { APP, INSTALLING_PYTHON } from "../../../main/helpers/constants";

import { StyledImage } from "@/atoms/image/styled";
import { directoryAtom, imagesAtom, datasetsAtom } from "@/ions/atoms";
import { makeStaticProperties } from "@/ions/i18n/get-static";
import { CustomScrollbars } from "@/organisms/custom-scrollbars";
import { DeleteConfirm } from "@/organisms/delete-confirm";
import { FolderDrop } from "@/organisms/folder-drop";
import { Lottie } from "@/organisms/lottie";
import { AddDatasetModal } from "@/organisms/modals/add-dataset";

export default function Page(_properties: InferGetStaticPropsType<typeof getStaticProps>) {
	const [datasets, setDatasets] = useAtom(datasetsAtom);
	const [, setImages] = useAtom(imagesAtom);
	const [, setDirectory] = useAtom(directoryAtom);
	const {
		t,
		i18n: { language: locale },
	} = useTranslation(["common"]);
	const [newDatasetOpen, setNewDatasetOpen] = useState(false);
	const [appReady, setAppReady] = useState(false);

	const { data: pythonInstallingData } = useSWR(INSTALLING_PYTHON);

	function handleCloseNewDataset() {
		setNewDatasetOpen(false);
	}

	function handleOpenNewDataset() {
		setNewDatasetOpen(true);
	}

	useEffect(() => {
		window.ipc.getDatasets().then(datasets_ => {
			setDatasets(datasets_);
		});
	}, [setDatasets]);

	useEffect(() => {
		setImages([]);
	}, [setImages]);

	useEffect(() => {
		if (typeof pythonInstallingData === "boolean") {
			setAppReady(!pythonInstallingData);
		}
	}, [pythonInstallingData]);

	useEffect(() => {
		const unsubscribe = window.ipc.on(`${APP}:ready`, () => {
			console.log("APP IS READY");
			setAppReady(true);
		});
		return () => {
			unsubscribe();
		};
	}, []);

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
						disabled={!appReady}
						color="primary"
						size="sm"
						startDecorator={<AddToPhotosIcon />}
						onClick={handleOpenNewDataset}
					>
						{t("common:new")}
					</Button>
					<AddDatasetModal open={newDatasetOpen} onClose={handleCloseNewDataset} />
				</Sheet>
				<Box sx={{ flex: 1, position: "relative" }}>
					<Box sx={{ position: "absolute", inset: 0 }}>
						<FolderDrop
							onDrop={path => {
								if (appReady) {
									setDirectory(path);
									handleOpenNewDataset();
								}
							}}
						>
							{datasets.length > 0 && appReady ? (
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
										{datasets?.map(dataset => (
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
																	src={`my://${dataset.servedFiles}/${dataset.cover}`}
																	alt=""
																	height={1024}
																	width={1024}
																/>
															</Button>
														</Link>
													</Box>
												</Tooltip>
											</Grid>
										))}
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
									{appReady ? (
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
									) : (
										<Box
											sx={{
												width: "max-content",
											}}
										>
											<Lottie
												path="/lottie/minimalistic/tech-discovery.json"
												height={400}
											/>
											<LinearProgress />
											<Typography
												level="h2"
												sx={{ textAlign: "center", mt: 2 }}
											>
												{t("common:initialSetup")}
											</Typography>
											<Typography sx={{ textAlign: "center" }}>
												{t("common:settingUpApp")}
											</Typography>
										</Box>
									)}
								</Box>
							)}
						</FolderDrop>
					</Box>
				</Box>
			</Box>
		</>
	);
}

export const getStaticProps = makeStaticProperties(["common"]);

export { getStaticPaths } from "@/ions/i18n/get-static";