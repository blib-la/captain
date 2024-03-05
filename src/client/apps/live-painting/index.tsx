import { ClickAwayListener } from "@mui/base";
import BrushIcon from "@mui/icons-material/Brush";
import CasinoIcon from "@mui/icons-material/Casino";
import ClearIcon from "@mui/icons-material/Clear";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import PaletteIcon from "@mui/icons-material/Palette";
import PhotoFilterIcon from "@mui/icons-material/PhotoFilter";
import SaveIcon from "@mui/icons-material/Save";
import Box from "@mui/joy/Box";
import FormControl from "@mui/joy/FormControl";
import FormLabel from "@mui/joy/FormLabel";
import IconButton from "@mui/joy/IconButton";
import Option from "@mui/joy/Option";
import Select from "@mui/joy/Select";
import Sheet from "@mui/joy/Sheet";
import Slider from "@mui/joy/Slider";
import Textarea from "@mui/joy/Textarea";
import ToggleButtonGroup from "@mui/joy/ToggleButtonGroup";
import Tooltip from "@mui/joy/Tooltip";
import Typography from "@mui/joy/Typography";
import { useAtom } from "jotai/index";
import { useTranslation } from "next-i18next";
import { useState } from "react";
import { v4 } from "uuid";

import { clearCounterAtom, imageAtom, imagesAtom, livePaintingOptionsAtom } from "./atoms";
import { DrawingArea } from "./drawing-area";
import { RenderingArea } from "./rendering-area";
import type { IllustrationStyles } from "./text-to-image";
import { illustrationStyles } from "./text-to-image";

import { LOCAL_PROTOCOL } from "#/constants";
import { randomSeed } from "#/number";
import { FlagUs } from "@/atoms/flags/us";
import { ImageEditIcon, ImageRemoveIcon, OverlayEditIcon } from "@/atoms/icons";
import { getContrastColor } from "@/ions/utils/color";

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
	const [prompt, setPrompt] = useState("a person enjoying nature");
	const [illustrationStyle, setIllustrationStyle] = useState<IllustrationStyles>("childrensBook");
	const [seed, setSeed] = useState(randomSeed());
	const isOverlay = value === "overlay";
	const [images, setImages] = useAtom(imagesAtom);

	// UseEffect(() => {
	// 	if (running) {
	// 		window.ipc.send(buildKey([ID.LIVE_PAINT], { suffix: ":settings" }), {
	// 			prompt: [prompt, illustrationStyles[illustrationStyle]].join(", "),
	// 			seed,
	// 		});
	// 	}
	// }, [prompt, seed, running, illustrationStyle]);

	return (
		<Box sx={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column" }}>
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
