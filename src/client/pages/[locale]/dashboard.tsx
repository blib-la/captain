import { CustomScrollbars } from "@captn/react/custom-scrollbars";
import Box from "@mui/joy/Box";
import Button from "@mui/joy/Button";
import Card from "@mui/joy/Card";
import CardActions from "@mui/joy/CardActions";
import Grid from "@mui/joy/Grid";
import Modal from "@mui/joy/Modal";
import ModalClose from "@mui/joy/ModalClose";
import ModalDialog from "@mui/joy/ModalDialog";
import Sheet from "@mui/joy/Sheet";
import Stack from "@mui/joy/Stack";
import Typography from "@mui/joy/Typography";
import dayjs from "dayjs";
import type { InferGetStaticPropsType } from "next";
import Head from "next/head";
import { useTranslation } from "next-i18next";
import { useEffect, useState } from "react";

import { buildKey } from "#/build-key";
import { ID } from "#/enums";
import type { ImageItem } from "#/types";
import { Markdown } from "@/apps/story/markdown";
import { makeStaticProperties } from "@/ions/i18n/get-static";
import { localFile } from "@/ions/utils/string";
import { localeFlags } from "@/organisms/language-select";

export default function Page(_properties: InferGetStaticPropsType<typeof getStaticProps>) {
	const { t } = useTranslation(["common", "labels"]);

	const [files, setFiles] = useState<any[]>([]);
	const [story, setStory] = useState<{ markdown: string; images: ImageItem[] } | null>(null);

	useEffect(() => {
		window.ipc.send(buildKey([ID.STORY], { suffix: ":get-all" }), {
			fileTypes: [".json"],
		});
		const unsubscribe = window.ipc.on(buildKey([ID.STORY], { suffix: ":all" }), files_ => {
			setFiles(files_);
		});

		return () => {
			unsubscribe();
		};
	}, []);

	useEffect(() => {
		console.log(files);
	}, [files]);
	return (
		<>
			<Head>
				<title>{`Captain | ${t("common:training")}`}</title>
			</Head>
			<Modal
				open={Boolean(story)}
				onClose={() => {
					setStory(null);
				}}
			>
				<ModalDialog sx={{ width: "80%", maxWidth: 1440, p: 1 }}>
					<ModalClose />
					<Box sx={{ mt: 5, mb: 1, px: 1, overflow: "auto" }}>
						<Box component="a" href="#" />
						{story && <Markdown markdown={story.markdown} images={story.images} />}
					</Box>
				</ModalDialog>
			</Modal>

			<Stack sx={{ position: "absolute", inset: 0, overflow: "hidden" }}>
				<Sheet
					sx={{
						position: "sticky",
						top: 0,
						display: "flex",
						alignItems: "center",
						height: 44,
						px: 1,
						zIndex: 1,
					}}
				>
					<Typography level="h4" component="h1">
						{t("labels:dashboard")}
					</Typography>
				</Sheet>
				<Box
					sx={{
						flex: 1,
						position: "relative",
					}}
				>
					<CustomScrollbars>
						<Box sx={{ px: 1 }}>
							<Grid
								container
								spacing={1}
								columns={{ xs: 1, sm: 2, md: 3, lg: 4, xl: 6 }}
							>
								{files
									.sort((a, b) => dayjs(b.createdAt).diff(a.createdAt))
									.map(file => (
										<Grid key={file.id} xs={1} sx={{ display: "flex" }}>
											<Card variant="soft" sx={{ flex: 1 }}>
												<Typography
													startDecorator={localeFlags[file.locale]}
													sx={{ flex: 1, alignItems: "flex-start" }}
												>
													{file.title}
												</Typography>
												<Typography level="body-xs" component="div">
													{dayjs(file.createdAt).format(
														"YYYY/MM/DD hh:mm:ss"
													)}
												</Typography>
												<Box
													component="img"
													src={localFile(file.cover)}
													sx={{ width: "100%", height: "auto" }}
												/>
												<CardActions>
													<Button
														onClick={async () => {
															const data = await window.ipc.readFile(
																file.path
															);
															console.log(data);
															const json = JSON.parse(data);
															setStory({
																markdown: json.story,
																images: json.images,
															});
														}}
													>
														{t("labels:readStory")}
													</Button>
												</CardActions>
											</Card>
										</Grid>
									))}
							</Grid>
						</Box>
					</CustomScrollbars>
				</Box>
			</Stack>
		</>
	);
}

export const getStaticProps = makeStaticProperties(["common", "texts", "labels"]);

export { getStaticPaths } from "@/ions/i18n/get-static";
