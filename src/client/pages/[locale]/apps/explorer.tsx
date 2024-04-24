import { AppFrame } from "@captn/joy/app-frame";
import { CustomScrollbars } from "@captn/joy/custom-scrollbars";
import { TitleBar } from "@captn/joy/title-bar";
import { useVectorStore } from "@captn/react/use-vector-store";
import { localFile } from "@captn/utils/string";
import type { VectorStoreResponse } from "@captn/utils/types";
import FolderIcon from "@mui/icons-material/Folder";
import SearchIcon from "@mui/icons-material/Search";
import Box from "@mui/joy/Box";
import Input from "@mui/joy/Input";
import List from "@mui/joy/List";
import ListItem from "@mui/joy/ListItem";
import ListItemButton from "@mui/joy/ListItemButton";
import ListItemContent from "@mui/joy/ListItemContent";
import ListItemDecorator from "@mui/joy/ListItemDecorator";
import Sheet from "@mui/joy/Sheet";
import Typography from "@mui/joy/Typography";
import { groupBy, uniqBy } from "lodash";
import type { InferGetStaticPropsType } from "next";
import Head from "next/head";
import { useTranslation } from "next-i18next";
import { Fragment, useMemo, useState } from "react";
import { FileIcon, defaultStyles } from "react-file-icon";

import { DynamicIcon } from "@/atoms/icons/dynamic";
import { handleCaptainAction } from "@/ions/handlers/action";
import { makeStaticProperties } from "@/ions/i18n/get-static";
import { getContrastColor } from "@/ions/utils/color";

export function PreviewIcon({ item }: { item: VectorStoreResponse }) {
	switch (item.payload.type) {
		case "story": {
			return (
				<ListItemDecorator
					sx={{
						m: 0,
						px: 1,
						height: 64,
						width: 64,
						position: "relative",
					}}
				>
					<FileIcon extension={item.payload.fileType} {...defaultStyles.md} />
				</ListItemDecorator>
			);
		}

		case "image": {
			return (
				<ListItemDecorator
					sx={{
						m: 0,
						p: 0,
						height: 64,
						width: 64,
						position: "relative",
					}}
				>
					<Box
						component="img"
						src={localFile(item.payload.filePath!)}
						sx={{
							width: "100%",
							height: "100%",
							objectFit: "contain",
						}}
					/>
				</ListItemDecorator>
			);
		}

		default: {
			return (
				<ListItemDecorator
					sx={theme => ({
						m: 0,
						p: 2,
						height: 64,
						width: 64,
						position: "relative",
						bgcolor: item.payload.iconColor || theme.palette.neutral["500"],
						color: getContrastColor(
							item.payload.iconColor || theme.palette.neutral["500"]
						),
						borderRadius: "md",
					})}
				>
					<DynamicIcon
						icon={item.payload.icon || item.payload.type || "none"}
						sx={{
							fontSize: 32,
							color: "currentColor",
						}}
					/>
				</ListItemDecorator>
			);
		}
	}
}

export default function Page(_properties: InferGetStaticPropsType<typeof getStaticProps>) {
	const { t } = useTranslation(["common", "labels"]);
	const [query, setQuery] = useState("");
	const { data } = useVectorStore(query, { limit: 100, score_threshold: 0.2 });

	const uniqueData = useMemo(() => uniqBy(data, "payload.id"), [data]);
	const groups = useMemo(
		() =>
			// Group all items by the 'type' found in their payload
			groupBy(uniqueData, item => item.payload.type),
		[uniqueData]
	);

	return (
		<AppFrame
			titleBar={
				<TitleBar color="violet" variant="solid">
					<Typography level="title-md" component="h1" startDecorator={<FolderIcon />}>
						{t("labels:explorer")}
					</Typography>
				</TitleBar>
			}
		>
			<Head>
				<title>{t("labels:explorer")}</title>
			</Head>
			<Box
				sx={{
					position: "absolute",
					inset: 0,
					display: "flex",
					flexDirection: "column",
				}}
			>
				<Sheet variant="soft" sx={{ display: "flex", gap: 1, p: 0.5 }}>
					<Box sx={{ flex: 1 }} />
					<Box sx={{ flex: 1, maxWidth: 400 }}>
						<Input
							fullWidth
							aria-label={t("labels:search")}
							value={query}
							endDecorator={<SearchIcon />}
							onChange={event => {
								setQuery(event.target.value);
							}}
						/>
					</Box>
				</Sheet>

				<Box sx={{ position: "relative", flex: 1 }}>
					<CustomScrollbars>
						<Box sx={{ px: 1 }}>
							{Object.entries(groups).map(([key, group]) => (
								<Fragment key={key}>
									<Sheet
										variant="outlined"
										sx={{
											mx: -1,
											px: 1,
											py: 0.5,
											position: "sticky",
											top: 0,
											zIndex: 1,
										}}
									>
										<Typography level="title-lg">
											{t(`labels:${key}`)}
										</Typography>
									</Sheet>
									<List
										sx={{
											display: "grid",
											gridTemplateColumns:
												"repeat(auto-fill,minmax(200px, 1fr))",
											gap: 2,
										}}
									>
										{group.map(item => (
											<ListItem
												key={item.id}
												sx={{
													"--focus-outline-offset": "-2px",
												}}
											>
												<ListItemButton
													// Disabled={item.payload.type !== "app"}
													sx={{
														flexDirection: "column",
														width: 128,
														p: 1,
													}}
													onClick={() => {
														switch (item.payload.type) {
															case "app": {
																handleCaptainAction(item);
																break;
															}

															case "image":
															case "story":
															case "markdown": {
																handleCaptainAction(
																	{
																		score: 1,
																		payload: {
																			id: "preview",
																			language: "en",
																			type: "app",
																			label: "Preview",
																			creatorID: "Blibla",
																		},
																	},
																	{
																		id: item.payload.id,
																		fileType: item.payload.type,
																		filePath:
																			item.payload.filePath!,
																	}
																);
																break;
															}

															default: {
																break;
															}
														}
													}}
												>
													<PreviewIcon item={item} />
													<ListItemContent
														sx={{ width: "100%", overflow: "hidden" }}
													>
														<Typography
															level="body-xs"
															sx={{ textAlign: "center" }}
														>
															{item.payload.label}
														</Typography>
													</ListItemContent>
												</ListItemButton>
											</ListItem>
										))}
									</List>
								</Fragment>
							))}
						</Box>
					</CustomScrollbars>
				</Box>
			</Box>
		</AppFrame>
	);
}

export const getStaticProps = makeStaticProperties(["common", "texts", "labels"]);

export { getStaticPaths } from "@/ions/i18n/get-static";
