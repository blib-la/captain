import { ClickAwayListener } from "@mui/base";
import BrushIcon from "@mui/icons-material/Brush";
import CasinoIcon from "@mui/icons-material/Casino";
import CheckIcon from "@mui/icons-material/Check";
import ClearIcon from "@mui/icons-material/Clear";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import MmsIcon from "@mui/icons-material/Mms";
import PaletteIcon from "@mui/icons-material/Palette";
import PhotoFilterIcon from "@mui/icons-material/PhotoFilter";
import SaveIcon from "@mui/icons-material/Save";
import Box from "@mui/joy/Box";
import Button from "@mui/joy/Button";
import CircularProgress from "@mui/joy/CircularProgress";
import FormControl from "@mui/joy/FormControl";
import FormLabel from "@mui/joy/FormLabel";
import IconButton from "@mui/joy/IconButton";
import Modal from "@mui/joy/Modal";
import ModalClose from "@mui/joy/ModalClose";
import ModalDialog from "@mui/joy/ModalDialog";
import Option from "@mui/joy/Option";
import Select from "@mui/joy/Select";
import Sheet from "@mui/joy/Sheet";
import Slider from "@mui/joy/Slider";
import Textarea from "@mui/joy/Textarea";
import ToggleButtonGroup from "@mui/joy/ToggleButtonGroup";
import Tooltip from "@mui/joy/Tooltip";
import Typography from "@mui/joy/Typography";
import dayjs from "dayjs";
import { useAtom } from "jotai/index";
import { useTranslation } from "next-i18next";
import { useEffect, useState } from "react";
import { v4 } from "uuid";

import { buildKey } from "#/build-key";
import { LOCAL_PROTOCOL } from "#/constants";
import { ID } from "#/enums";
import { randomSeed } from "#/number";
import { extractH1Headings } from "#/string";
import { FlagUs } from "@/atoms/flags/us";
import { ImageEditIcon, ImageRemoveIcon, OverlayEditIcon } from "@/atoms/icons";
import {
	clearCounterAtom,
	imageAtom,
	imagesAtom,
	livePaintingOptionsAtom,
	storyImagesAtom,
} from "@/ions/atoms/live-painting";
import type { IllustrationStyles } from "@/ions/text-to-image";
import { illustrationStyles } from "@/ions/text-to-image";
import { getContrastColor } from "@/ions/utils/color";
import { replaceImagePlaceholders } from "@/ions/utils/string";
import { DrawingArea } from "@/organisms/live-painting/drawing-area";
import { RenderingArea } from "@/organisms/live-painting/rendering-area";
import { Markdown } from "@/organisms/markdown";
import { StoryForm } from "@/organisms/story";

export type ViewType = "side-by-side" | "overlay";

export function LivePainting({ running }: { running?: boolean }) {
	const {
		t,
		i18n: { language: locale },
	} = useTranslation(["common", "labels"]);
	const [value, setValue] = useState<ViewType>("side-by-side");
	const [livePaintingOptions, setLivePaintingOptions] = useAtom(livePaintingOptionsAtom);
	const [, setClearCounter] = useAtom(clearCounterAtom);
	const [image] = useAtom(imageAtom);
	const [brushSizeOpen, setBrushSizeOpen] = useState(false);
	const [generatingStory, setGeneratingStory] = useState(false);
	const [story, setStory] = useState("");
	const [prompt, setPrompt] = useState("a person enjoying nature");
	const [illustrationStyle, setIllustrationStyle] = useState<IllustrationStyles>("childrensBook");
	const [storyModalOpen, setStoryModalOpen] = useState(false);
	const [storyConfigModalOpen, setStoryConfigModalOpen] = useState(false);
	const [seed, setSeed] = useState(randomSeed());
	const isOverlay = value === "overlay";
	const [images, setImages] = useAtom(imagesAtom);
	const [storyImages, setStoryImages] = useAtom(storyImagesAtom);
	const [saved, setSaved] = useState(false);

	const [openAiApiKey, setOpenAiApiKey] = useState("");

	useEffect(() => {
		window.ipc.send(buildKey([ID.KEYS], { suffix: ":get-openAiApiKey" }));
		const unsubscribeApiKey = window.ipc.on(
			buildKey([ID.KEYS], { suffix: ":openAiApiKey" }),
			(openAiApiKey_: string) => {
				setOpenAiApiKey(openAiApiKey_);
			}
		);
		const unsubscribeStoryGenerated = window.ipc.on(
			buildKey([ID.STORY], { suffix: ":generated" }),
			(story_: string) => {
				setStory(story_);
				setStoryModalOpen(true);
				setGeneratingStory(false);
				setSaved(false);
			}
		);
		return () => {
			unsubscribeStoryGenerated();
			unsubscribeApiKey();
		};
	}, []);

	useEffect(() => {
		if (running) {
			window.ipc.send(buildKey([ID.LIVE_PAINT], { suffix: ":settings" }), {
				prompt: [prompt, illustrationStyles[illustrationStyle]].join(", "),
				seed,
			});
		}
	}, [prompt, seed, running, illustrationStyle]);

	return (
		<Box sx={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column" }}>
			<Modal
				open={storyModalOpen}
				onClose={() => {
					setStoryModalOpen(false);
				}}
			>
				<ModalDialog sx={{ width: "80%", maxWidth: 1440, p: 1 }}>
					<ModalClose aria-label={t("labels:close")} />
					<Button
						disabled={saved}
						startDecorator={saved ? <CheckIcon /> : <SaveIcon />}
						size="sm"
						sx={theme => ({
							position: "absolute",
							top: theme.spacing(1),
							left: theme.spacing(1),
						})}
						onClick={async () => {
							const id = v4();
							const now = dayjs().toString();
							await Promise.all([
								window.ipc.saveFile(
									`stories/${id}/story.md`,
									replaceImagePlaceholders(story, storyImages)
								),
								window.ipc.saveFile(
									`stories/${id}/info.json`,
									JSON.stringify({
										id,
										locale,
										type: "story",
										story,
										createdAt: now,
										updatedAt: now,
										title: extractH1Headings(story)[0],
										images: storyImages,
									})
								),
								...storyImages.map(({ dataUrl }, index) =>
									window.ipc.saveFile(
										`stories/${id}/${index + 1}.png`,
										dataUrl.split(";base64,").pop()!,
										{ encoding: "base64" }
									)
								),
							]);
							setSaved(true);
						}}
					>
						{saved ? t("labels:saved") : t("labels:save")}
					</Button>
					<Box sx={{ mt: 5, mb: 1, px: 1, overflow: "auto" }}>
						<Markdown key="story" markdown={story} images={storyImages} />
					</Box>
				</ModalDialog>
			</Modal>
			<Modal
				open={storyConfigModalOpen}
				onClose={() => {
					setStoryConfigModalOpen(false);
				}}
			>
				<ModalDialog>
					<ModalClose aria-label={t("labels:close")} />
					<Box sx={{ mt: 4, width: "100%", overflow: "auto" }}>
						<StoryForm
							onSubmit={() => {
								setStoryImages(images);
								setGeneratingStory(true);
								setStoryConfigModalOpen(false);
							}}
						/>
					</Box>
				</ModalDialog>
			</Modal>
			<Sheet
				sx={{
					position: "relative",
					zIndex: 2,
					display: "flex",
					alignItems: "center",
					flexShrink: 0,
					height: 44,
				}}
			>
				<Box sx={{ display: "flex", gap: 1, flex: 1, px: 1, width: "50%" }}>
					<ToggleButtonGroup
						value={value}
						color="neutral"
						variant="plain"
						size="md"
						onChange={(event, newValue) => {
							if (newValue) {
								setValue(newValue);
							}
						}}
					>
						<Tooltip title={t("labels:sideBySide")}>
							<IconButton value="side-by-side" aria-label={t("labels:sideBySide")}>
								<ImageEditIcon />
								<PhotoFilterIcon />
							</IconButton>
						</Tooltip>
						<Tooltip title={t("labels:overlay")}>
							<IconButton value="overlay" aria-label={t("labels:overlay")}>
								<OverlayEditIcon />
							</IconButton>
						</Tooltip>
					</ToggleButtonGroup>
					<Box sx={{ width: 8 }} />
					<Tooltip title={t("labels:color")}>
						<IconButton
							component="label"
							size="md"
							tabIndex={-1}
							aria-label={t("labels:color")}
							sx={{
								"--Icon-color": "currentColor",
								overflow: "hidden",
							}}
							style={{
								backgroundColor: livePaintingOptions.color,
								color: getContrastColor(livePaintingOptions.color),
							}}
						>
							<input
								type="color"
								value={livePaintingOptions.color}
								style={{
									width: "100%",
									height: "100%",
									minWidth: 0,
									opacity: 0,
									position: "absolute",
									inset: 0,
									cursor: "pointer",
								}}
								onChange={event => {
									setLivePaintingOptions(previousState => ({
										...previousState,
										color: event.target.value,
									}));
								}}
							/>
							<PaletteIcon />
						</IconButton>
					</Tooltip>
					<Tooltip
						disableInteractive={false}
						open={brushSizeOpen}
						variant="soft"
						sx={{ p: 0 }}
						title={
							<ClickAwayListener
								onClickAway={() => {
									setBrushSizeOpen(false);
								}}
							>
								<Box
									sx={{ display: "flex", width: 200, px: 2, py: 1 }}
									onMouseLeave={() => {
										setBrushSizeOpen(false);
									}}
								>
									<Slider
										min={1}
										max={100}
										step={1}
										value={livePaintingOptions.brushSize}
										slotProps={{ input: { autoFocus: true } }}
										onChange={(event, value) => {
											setLivePaintingOptions(previousState => ({
												...previousState,
												brushSize: value as number,
											}));
										}}
									/>
								</Box>
							</ClickAwayListener>
						}
					>
						<Tooltip title={t("labels:brushSize")} sx={{ py: 0.5, px: 0.75 }}>
							<IconButton
								size="md"
								variant="soft"
								aria-label={t("labels:brushSize")}
								onClick={() => {
									setBrushSizeOpen(true);
								}}
							>
								<BrushIcon />
							</IconButton>
						</Tooltip>
					</Tooltip>

					<Tooltip title={t("labels:clear")}>
						<IconButton
							size="md"
							variant="soft"
							aria-label={t("labels:clear")}
							onClick={() => {
								setClearCounter(previousState => previousState + 1);
							}}
						>
							<ClearIcon />
						</IconButton>
					</Tooltip>
					<Box sx={{ flex: 1 }} />
				</Box>
				<Box
					sx={{
						display: "flex",
						gap: 1,
						flex: 1,
						px: 1,
						width: "50%",
						overflow: "hidden",
						alignItems: "center",
						flexShrink: 0,
						height: 44,
					}}
				>
					<Tooltip title={t("labels:removeAllImages")}>
						<IconButton
							size="md"
							variant="soft"
							aria-label={t("labels:removeAllImages")}
							onClick={() => {
								setImages([]);
							}}
						>
							<ImageRemoveIcon />
						</IconButton>
					</Tooltip>

					<Box sx={{ flex: 1, overflowX: "auto" }}>
						<Box sx={{ display: "flex", gap: 1 }}>
							{images.map(image_ => (
								<Tooltip
									key={image_.id}
									disableInteractive={false}
									title={
										<Box sx={{ position: "relative" }}>
											<IconButton
												aria-label={t("labels:delete")}
												size="sm"
												color="danger"
												variant="solid"
												sx={{ position: "absolute", top: 0, right: 0 }}
												onClick={() => {
													setImages(previousState =>
														previousState.filter(
															({ id }) => id !== image_.id
														)
													);
												}}
											>
												<DeleteForeverIcon />
											</IconButton>
											<Box
												component="img"
												src={`${LOCAL_PROTOCOL}://${image_.url}`}
												alt=""
												sx={{ height: 300, width: "auto" }}
											/>
										</Box>
									}
								>
									<Box
										component="img"
										src={`${LOCAL_PROTOCOL}://${image_.url}`}
										alt=""
										sx={{ height: 36, width: "auto" }}
									/>
								</Tooltip>
							))}
						</Box>
					</Box>

					<Tooltip title={t("labels:randomize")}>
						<IconButton
							size="md"
							variant="soft"
							aria-label={t("labels:randomize")}
							onClick={() => {
								setSeed(randomSeed());
							}}
						>
							<CasinoIcon />
						</IconButton>
					</Tooltip>
					<Tooltip title={t("labels:saveImage")}>
						<IconButton
							disabled={!image || images.some(image_ => image_.dataUrl === image)}
							size="md"
							variant="soft"
							aria-label={t("labels:saveImage")}
							onClick={async () => {
								const id = v4();
								const url = await window.ipc.saveFile(
									`images/${id}.png`,
									image.split(";base64,").pop()!,
									{
										encoding: "base64",
									}
								);
								setImages(previousState => [
									...previousState,
									{ id, dataUrl: image, url },
								]);
							}}
						>
							<SaveIcon />
						</IconButton>
					</Tooltip>

					<Tooltip title={t("labels:createStory")}>
						<IconButton
							disabled={generatingStory || !openAiApiKey}
							size="md"
							variant="soft"
							aria-label={t("labels:createStory")}
							onClick={() => {
								setStoryConfigModalOpen(true);
							}}
						>
							{generatingStory ? <CircularProgress /> : <MmsIcon />}
						</IconButton>
					</Tooltip>
					<Tooltip title={t("labels:readStory")}>
						<IconButton
							disabled={!story?.trim()}
							size="md"
							variant="soft"
							aria-label={t("labels:readStory")}
							onClick={() => {
								setStoryModalOpen(true);
							}}
						>
							<MenuBookIcon />
						</IconButton>
					</Tooltip>
				</Box>
			</Sheet>
			<Sheet
				color="neutral"
				variant="soft"
				sx={{
					flex: 1,
					rowGap: 2,
					display: "flex",
					flexWrap: "wrap",
					py: 2,
					position: "relative",
					justifyContent: "center",
				}}
			>
				<Box
					sx={{
						width: {
							xs: "100%",
							md: isOverlay ? "100%" : "50%",
						},
						minWidth: "min-content",
						position: isOverlay ? "absolute" : "relative",
						inset: 0,
						zIndex: 1,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<DrawingArea isOverlay={isOverlay} />
				</Box>
				<Box
					sx={{
						width: {
							xs: "100%",
							md: isOverlay ? "100%" : "50%",
						},
						minWidth: "min-content",
						position: "relative",
						flex: isOverlay ? 1 : undefined,
						zIndex: 0,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<RenderingArea />
				</Box>
			</Sheet>
			<Box
				sx={{
					display: "flex",
					gap: 1,
					flexDirection: { xs: "column", md: "row" },
					px: 1,
					py: 2,
				}}
			>
				<FormControl sx={{ minWidth: 200 }}>
					<FormLabel>{t("labels:artStyle")}</FormLabel>
					<Select
						value={illustrationStyle}
						renderValue={option =>
							option && (
								<Typography>
									{t(`labels:illustrationStyles.${option.value}`)}
								</Typography>
							)
						}
						onChange={(_event, value_) => {
							if (value_) {
								setIllustrationStyle(value_);
							}
						}}
					>
						{Object.entries(illustrationStyles).map(([key_]) => (
							<Option
								key={key_}
								value={key_}
								sx={{ flexDirection: "column", alignItems: "stretch" }}
							>
								<Typography>{t(`labels:illustrationStyles.${key_}`)}</Typography>
								{key_ === "custom" && (
									<Typography level="body-xs" component="div">
										{t(`labels:illustrationStyles.customInfo`)}
									</Typography>
								)}
							</Option>
						))}
					</Select>
				</FormControl>
				<FormControl sx={{ flex: 1 }}>
					<FormLabel>{t("labels:prompt")}</FormLabel>
					<Textarea
						minRows={3}
						maxRows={3}
						value={prompt}
						startDecorator={
							<Typography startDecorator={<FlagUs />} level="body-xs">
								{t("labels:promptInfo")}
							</Typography>
						}
						onChange={event => {
							setPrompt(event.target.value);
						}}
					/>
				</FormControl>
			</Box>
		</Box>
	);
}
