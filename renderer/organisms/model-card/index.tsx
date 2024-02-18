import { ClickAwayListener } from "@mui/base";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import CheckIcon from "@mui/icons-material/Check";
import DownloadIcon from "@mui/icons-material/Download";
import LinkIcon from "@mui/icons-material/Link";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import Badge from "@mui/joy/Badge";
import Box from "@mui/joy/Box";
import Button from "@mui/joy/Button";
import ButtonGroup from "@mui/joy/ButtonGroup";
import Card from "@mui/joy/Card";
import CardContent from "@mui/joy/CardContent";
import CircularProgress from "@mui/joy/CircularProgress";
import IconButton from "@mui/joy/IconButton";
import Menu from "@mui/joy/Menu";
import MenuItem from "@mui/joy/MenuItem";
import Tooltip from "@mui/joy/Tooltip";
import Typography from "@mui/joy/Typography";
import { useAtom } from "jotai";
import { useTranslation } from "next-i18next";
import type { MouseEvent as ReactMouseEvent } from "react";
import { useEffect, useRef, useState } from "react";
import useSWR from "swr";

import { DOWNLOADS } from "../../../main/helpers/constants";

import { captionsAtom, checkpointsAtom, lorasAtom } from "@/ions/atoms";
import { fetcher } from "@/ions/swr/fetcher";

export const architectureMap = {
	"sd-2-1": "SD 2.1",
	"sd-xl-turbo": "SDXL Turbo",
	"sd-2-1-turbo": "SD Turbo",
	"sd-1-5": "SD 1.5",
	"sd-xl-1-0": "SDXL",
};

const modelAtoms = {
	loras: lorasAtom,
	checkpoints: checkpointsAtom,
	wd14: captionsAtom,
};

// TODO this component has too much business logic.
export function ModelCard({
	id,
	title,
	author,
	caption,
	files,
	git,
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
	git?: boolean;
	caption?: string;
	architecture: string;
	files?: Array<{ filename: string; variant?: string; required?: boolean }>;
	title: string;
	image?: string;
}) {
	const [isDownloading, setIsDownloading] = useState(false);
	const { t } = useTranslation(["common"]);
	const [isDownloadOptionsOpen, setIsDownloadOptionsOpen] = useState(false);

	const anchorReference = useRef<HTMLDivElement>(null);
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [checkpoints] = useAtom(modelAtoms[type as keyof typeof modelAtoms]);

	const selectedFile = files ? files[selectedIndex] : null;
	let installed: boolean;
	if (type === "wd14") {
		installed = checkpoints.includes(id);
	} else {
		installed = selectedFile ? checkpoints.includes(selectedFile?.filename) : false;
	}

	const hasVersion =
		type === "wd14"
			? files?.some(({ filename }) => checkpoints.includes([id, filename].join("/")))
			: files?.some(({ filename }) => checkpoints.includes(filename));

	const hasMultipleVersions = files && files.filter(item => !item.required).length > 1;

	function handleMenuItemClick(event: ReactMouseEvent<HTMLElement, MouseEvent>, index: number) {
		setSelectedIndex(index);
		setIsDownloadOptionsOpen(false);
	}

	const storeKey = selectedFile
		? `${DOWNLOADS}.${id}.${selectedFile.filename}`
		: `${DOWNLOADS}.${id}`;
	const { data } = useSWR(storeKey, fetcher, {
		refreshInterval: 1000,
	});

	useEffect(() => {
		setIsDownloading(Boolean(data));
	}, [data]);

	let buttonText = t("common:download");

	if (isDownloading) {
		buttonText = t("common:downloading");
	} else if (installed) {
		buttonText = t("common:installed");
	}

	return (
		<Card color="neutral" variant="soft">
			<>
				<Box sx={{ pr: 3 }}>
					<Badge
						color="secondary"
						size="sm"
						invisible={!hasVersion}
						badgeContent={<CheckIcon />}
						sx={{ display: "block" }}
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
						invisible={!architectureMap[architecture as keyof typeof architectureMap]}
						badgeContent={architectureMap[architecture as keyof typeof architectureMap]}
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
						<Box sx={{ width: "100%" }}>
							{image && (
								<Box
									component="img"
									src={image}
									loading="lazy"
									alt=""
									sx={{
										width: "100%",
										objectFit: "cover",
										aspectRatio: 1,
										bgcolor: "common.white",
									}}
								/>
							)}
							{caption && (
								<Typography
									level="body-md"
									sx={{
										mt: 1,
										WebkitLineClamp: 3,
										height: 72,
										WebkitBoxOrient: "vertical",
										overflow: "hidden",
										display: "-webkit-box",
									}}
								>
									{caption}
								</Typography>
							)}
						</Box>
					</Badge>
				</Box>
				<Typography noWrap level="body-sm" startDecorator={<WorkspacePremiumIcon />}>
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
								ref={anchorReference}
								size="md"
								variant="solid"
								color="primary"
								sx={{ width: "100%" }}
							>
								<Tooltip
									sx={{ display: hasMultipleVersions ? undefined : "none" }}
									title={
										selectedFile
											? `${selectedFile.filename}${hasMultipleVersions ? ` (${selectedFile.variant})` : ""}`
											: ""
									}
								>
									<Button
										sx={{ flex: 1 }}
										disabled={
											installed || isDownloading || (!selectedFile && !git)
										}
										startDecorator={
											isDownloading ? <CircularProgress /> : <DownloadIcon />
										}
										onClick={async () => {
											setIsDownloading(true);
											try {
												await window.ipc.fetch(storeKey, {
													method: "POST",
													data: true,
												});

												if (
													files?.every(file => file.required) &&
													selectedFile
												) {
													console.log("all required");
													for (const file of files) {
														await window.ipc.downloadModel(
															type,
															`${link}/resolve/main/${file.filename}?download=true`,
															{ id, storeKey }
														);
													}
												} else if (selectedFile) {
													await window.ipc.downloadModel(
														type,
														`${link}/resolve/main/${selectedFile.filename}?download=true`,
														{ id, storeKey }
													);
												} else if (git) {
													await window.ipc.gitCloneLFS(
														"caption/llama",
														id
													);
												}
											} catch (error) {
												console.log(error);
											} finally {
												setIsDownloading(false);
											}
										}}
									>
										{buttonText}
									</Button>
								</Tooltip>
								{hasMultipleVersions && (
									<IconButton
										onClick={() => {
											setIsDownloadOptionsOpen(!isDownloadOptionsOpen);
										}}
									>
										<ArrowDropDownIcon />
									</IconButton>
								)}
							</ButtonGroup>
							{files && (
								<Menu
									open={isDownloadOptionsOpen}
									anchorEl={anchorReference.current}
									onClose={() => {
										setIsDownloadOptionsOpen(false);
									}}
								>
									{files.map((option, index) => (
										<MenuItem
											key={option.filename}
											disabled={index === 2}
											selected={index === selectedIndex}
											onClick={event => handleMenuItemClick(event, index)}
										>
											{option.filename} ({option.variant})
										</MenuItem>
									))}
								</Menu>
							)}
						</Box>
					</ClickAwayListener>
				</CardContent>
			</>
		</Card>
	);
}
