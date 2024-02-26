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
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import SaveIcon from "@mui/icons-material/Save";
import StopIcon from "@mui/icons-material/Stop";
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
import Stack from "@mui/joy/Stack";
import SvgIcon from "@mui/joy/SvgIcon";
import Textarea from "@mui/joy/Textarea";
import ToggleButtonGroup from "@mui/joy/ToggleButtonGroup";
import Tooltip from "@mui/joy/Tooltip";
import Typography from "@mui/joy/Typography";
import dayjs from "dayjs";
import { atom, useAtom } from "jotai";
import type { InferGetStaticPropsType } from "next";
import Head from "next/head";
import { useTranslation } from "next-i18next";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { v4 } from "uuid";

import { buildKey } from "#/build-key";
import { LOCAL_PROTOCOL } from "#/constants";
import { ID } from "#/enums";
import { extractH1Headings } from "#/string";
import type { FormInput } from "#/types/story";
import { FlagUs } from "@/atoms/flags/us";
import { makeStaticProperties } from "@/ions/i18n/get-static";
import { getContrastColor } from "@/ions/utils/color";
import { replaceImagePlaceholders } from "@/ions/utils/string";
import { CustomScrollbars } from "@/organisms/custom-scrollbars";
import { Markdown } from "@/organisms/markdown";

export type ViewType = "side-by-side" | "overlay";
const livePaintingOptionsAtom = atom({
	brushSize: 5,
	color: "#000000",
});

const clearCounterAtom = atom(0);

function DrawingArea({ isOverlay }: { isOverlay?: boolean }) {
	const canvas = useRef<HTMLCanvasElement>(null);
	const context = useRef<CanvasRenderingContext2D | null>(null);
	const isDrawing = useRef<boolean>(false);
	const [livePaintingOptions] = useAtom(livePaintingOptionsAtom);
	const [clearCounter] = useAtom(clearCounterAtom);
	const canvasContainerReference = useRef<HTMLDivElement>(null);

	function startDrawing(event: ReactPointerEvent) {
		if (!canvas.current) {
			return;
		}

		isDrawing.current = true;
		const rect = canvas.current.getBoundingClientRect();
		context.current?.beginPath();
		context.current?.moveTo(event.clientX - rect.left, event.clientY - rect.top);
	}

	useEffect(() => {
		const canvasElement = canvas.current;
		let animationFame: number;
		if (!canvasElement) {
			return;
		}

		const dpr = window.devicePixelRatio || 1;
		canvasElement.height = 512 * dpr;
		canvasElement.width = 512 * dpr;
		context.current = canvasElement.getContext("2d");
		if (context.current) {
			context.current.scale(dpr, dpr);
		}

		function draw(event: MouseEvent) {
			if (!canvas.current) {
				return;
			}

			const rect = canvas.current.getBoundingClientRect();
			if (canvasContainerReference.current) {
				canvasContainerReference.current.style.setProperty(
					"--brushX",
					`${event.clientX - rect.left}px`
				);
				canvasContainerReference.current.style.setProperty(
					"--brushY",
					`${event.clientY - rect.top}px`
				);
			}

			if (!isDrawing.current) {
				return;
			}

			context.current?.lineTo(event.clientX - rect.left, event.clientY - rect.top);
			context.current?.stroke();
			const dataUrl = canvas.current.toDataURL();
			window.ipc.send(buildKey([ID.LIVE_PAINT], { suffix: ":dataUrl" }), dataUrl);
		}

		function handleMouseUp() {
			if (isDrawing.current) {
				context.current?.closePath();
				isDrawing.current = false;
			}

			cancelAnimationFrame(animationFame);
		}

		function handleMouseMove(event: MouseEvent) {
			animationFame = requestAnimationFrame(() => {
				draw(event);
			});
		}

		if (context.current) {
			context.current.fillStyle = "#ffffff";
			context.current.rect(0, 0, canvasElement.width, canvasElement.height);
			context.current.fill();

			context.current.lineJoin = "round";
			context.current.lineCap = "round";

			document.addEventListener("mousemove", handleMouseMove, { passive: true });
			document.addEventListener("mouseup", handleMouseUp);
		}

		return () => {
			document.removeEventListener("mousemove", handleMouseMove);
			document.removeEventListener("mouseup", handleMouseUp);
			cancelAnimationFrame(animationFame);
		};
	}, []);

	useEffect(() => {
		if (context.current) {
			context.current.strokeStyle = livePaintingOptions.color;
			context.current.shadowColor = livePaintingOptions.color;
			const shadowBlur = Math.min(livePaintingOptions.brushSize, 10);
			context.current.lineWidth = livePaintingOptions.brushSize - shadowBlur;
			context.current.shadowBlur = shadowBlur / 2;
			if (canvasContainerReference.current) {
				canvasContainerReference.current.style.setProperty(
					"--brushSize",
					`${livePaintingOptions.brushSize}px`
				);
				canvasContainerReference.current.style.setProperty(
					"--brushColor",
					livePaintingOptions.color
				);
			}
		}
	}, [livePaintingOptions]);

	useEffect(() => {
		if (context.current && canvas.current) {
			context.current.fillStyle = "#ffffff";
			context.current.clearRect(0, 0, canvas.current.width, canvas.current.height);
			context.current.fillRect(0, 0, canvas.current.width, canvas.current.height);
			const dataUrl = canvas.current.toDataURL();
			window.ipc.send(buildKey([ID.LIVE_PAINT], { suffix: ":dataUrl" }), dataUrl);
		}
	}, [clearCounter]);

	return (
		<Box
			ref={canvasContainerReference}
			sx={{
				width: 512,
				height: 512,
				boxShadow: "sm",
				position: "relative",
				overflow: "hidden",
				cursor: "none",
			}}
		>
			<canvas
				ref={canvas}
				style={{ opacity: isOverlay ? 0 : 1, height: "100%", width: "100%" }}
				onPointerDown={startDrawing}
			/>
			<Box
				sx={{
					position: "absolute",
					top: 0,
					left: 0,
					pointerEvents: "none",
					transform: "translate3d(var(--brushX, 0), var(--brushY, 0), 0)",
					width: "var(--brushSize, 10px)",
					height: "var(--brushSize, 10px)",
					margin: "calc(var(--brushSize, 10px) / -2)",
					backdropFilter: "invert(1)",
					borderRadius: "50%",
				}}
			/>
		</Box>
	);
}

const imageAtom = atom("");

const imagesAtom = atom<{ id: string; dataUrl: string; url: string }[]>([]);
const storyImagesAtom = atom<{ id: string; dataUrl: string; url: string }[]>([]);

function RenderingArea() {
	const [image, setImage] = useAtom(imageAtom);

	useEffect(() => {
		const unsubscribe = window.ipc.on(
			buildKey([ID.LIVE_PAINT], { suffix: ":generated" }),
			(dataUrl: string) => {
				setImage(dataUrl);
			}
		);

		return () => {
			unsubscribe();
		};
	}, [setImage]);
	return (
		<Box
			sx={{
				boxShadow: "sm",
				bgcolor: "common.white",
				width: 512,
				height: 512,
				display: "flex",
			}}
		>
			{image && <img height={512} width={512} src={image} alt="" />}
		</Box>
	);
}

export function ImageEditIcon() {
	return (
		<SvgIcon>
			<path d="M22.7 14.3L21.7 15.3L19.7 13.3L20.7 12.3C20.8 12.2 20.9 12.1 21.1 12.1C21.2 12.1 21.4 12.2 21.5 12.3L22.8 13.6C22.9 13.8 22.9 14.1 22.7 14.3M13 19.9V22H15.1L21.2 15.9L19.2 13.9L13 19.9M21 5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H11V19.1L12.1 18H5L8.5 13.5L11 16.5L14.5 12L16.1 14.1L21 9.1V5Z" />
		</SvgIcon>
	);
}

export function OverlayEditIcon() {
	return (
		<SvgIcon>
			<path d="M4 6H2V20C2 21.11 2.9 22 4 22H18V20H4V6M18.7 7.35L17.7 8.35L15.65 6.3L16.65 5.3C16.86 5.08 17.21 5.08 17.42 5.3L18.7 6.58C18.92 6.79 18.92 7.14 18.7 7.35M9 12.94L15.06 6.88L17.12 8.94L11.06 15H9V12.94M20 4L20 4L20 16L8 16L8 4H20M20 2H8C6.9 2 6 2.9 6 4V16C6 17.1 6.9 18 8 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" />
		</SvgIcon>
	);
}

export function ImageRemoveIcon() {
	return (
		<SvgIcon>
			<path d="M13 19C13 19.7 13.13 20.37 13.35 21H5C3.9 21 3 20.11 3 19V5C3 3.9 3.9 3 5 3H19C20.11 3 21 3.9 21 5V13.35C20.37 13.13 19.7 13 19 13V5H5V19H13M11.21 15.83L9.25 13.47L6.5 17H13.35C13.75 15.88 14.47 14.91 15.4 14.21L13.96 12.29L11.21 15.83M22.54 16.88L21.12 15.47L19 17.59L16.88 15.47L15.47 16.88L17.59 19L15.47 21.12L16.88 22.54L19 20.41L21.12 22.54L22.54 21.12L20.41 19L22.54 16.88Z" />
		</SvgIcon>
	);
}

function randomSeed() {
	return Math.ceil(Math.random() * 1_000_000_000) + 1;
}

export function StoryForm({ onSubmit }: { onSubmit?(): void }) {
	const {
		t,
		i18n: { language: locale },
	} = useTranslation(["labels"]);
	const [images] = useAtom(imagesAtom);
	const { handleSubmit, register, control, watch } = useForm<FormInput>({
		defaultValues: {
			length: "short",
			style: "magicalMystery",
			customStyle: "",
			characters: "",
			mood: "exciting",
		},
	});

	const style = watch("style");

	return (
		<Stack
			component="form"
			gap={2}
			onSubmit={handleSubmit(data => {
				if (onSubmit) {
					onSubmit();
				}

				window.ipc.send(buildKey([ID.STORY], { suffix: ":describe" }), {
					images: images.map(image => image.dataUrl),
					locale,
					options: data,
				});
			})}
		>
			<Typography>{t("labels:storyFormIntroduction")}</Typography>
			<FormControl required>
				<FormLabel>{t("labels:formLabel.length")}</FormLabel>
				<Controller
					name="length"
					control={control}
					render={({ field: { onChange, ...field } }) => (
						<Select
							{...field}
							required
							onChange={(event, value) => {
								onChange({ target: { value } });
							}}
						>
							<Option value="short">{t("labels:length.short")}</Option>
							<Option value="medium">{t("labels:length.medium")}</Option>
							<Option value="long">{t("labels:length.long")}</Option>
						</Select>
					)}
				/>
			</FormControl>
			<FormControl required>
				<FormLabel>{t("labels:formLabel.styleTheme")}</FormLabel>
				<Controller
					name="style"
					control={control}
					render={({ field: { onChange, ...field } }) => (
						<Select
							{...field}
							required
							onChange={(event, value) => {
								onChange({ target: { value } });
							}}
						>
							<Option value="magicalMystery">
								{t("labels:style.magicalMystery")}
							</Option>
							<Option value="adventure">{t("labels:style.adventure")}</Option>
							<Option value="sciFi">{t("labels:style.sciFi")}</Option>
							<Option value="historical">{t("labels:style.historical")}</Option>
							<Option value="custom">{t("labels:style.custom")}</Option>
						</Select>
					)}
				/>
			</FormControl>
			<FormControl
				sx={{
					display: style === "custom" ? undefined : "none",
				}}
			>
				<FormLabel>{t("labels:formLabel.customStyle")}</FormLabel>
				<Textarea
					disabled={style !== "custom"}
					{...register("customStyle", { required: style === "custom" })}
					placeholder={t("labels:placeholder.customStyle")}
				/>
			</FormControl>
			<FormControl>
				<FormLabel>{t("labels:formLabel.characters")}</FormLabel>
				<Textarea
					{...register("characters")}
					placeholder={t("labels:placeholder.characters")}
				/>
			</FormControl>
			<FormControl required>
				<FormLabel>{t("labels:formLabel.mood")}</FormLabel>
				<Controller
					name="mood"
					control={control}
					render={({ field: { onChange, ...field } }) => (
						<Select
							{...field}
							required
							onChange={(event, value) => {
								onChange({ target: { value } });
							}}
						>
							<Option value="joyful">{t("labels:mood.joyful")}</Option>
							<Option value="sad">{t("labels:mood.sad")}</Option>
							<Option value="suspenseful">{t("labels:mood.suspenseful")}</Option>
							<Option value="relaxing">{t("labels:mood.relaxing")}</Option>
							<Option value="exciting">{t("labels:mood.exciting")}</Option>
						</Select>
					)}
				/>
			</FormControl>
			<Button type="submit">{t("labels:submitButtonText")}</Button>
		</Stack>
	);
}

const example = `
# Tinkering with Time

## Chapter 1: Echoes in the Garage

Tommy had always been intrigued by the old garage at the end of the lane. ![inside a garage with a car](0) It was a place out of time, where the dust of decades clung to a classic blue car that never seemed to age. The shelves were lined with pots in every hue, and the walls adorned with tools that had seen the making and mending of countless machines.

It was here, in the silent conversations of inanimate objects, that Tommy felt the presence of his grandfather, a mechanic of the old world whose hands were skilled in the arts of repair and restoration.

## Chapter 2: Frequencies of the Past

Just beyond the garage, through a door that squeaked with stories, was the room that held his grandfather’s second love: radios. ![a room with various radios](1) Rows of dials, switches, and antennas filled the space, each piece a testament to a bygone era when voices traveled through the air like invisible threads stitching together the fabric of the community.

Tommy could almost hear the crackling sounds of history, the broadcasts of moon landings, and the whispers of the old radio shows that his grandfather would recount with a sparkle in his eye.

## Chapter 3: The Envelope from Yesteryear

The past had a way of lingering, and nowhere did it echo more profoundly than the post office at the corner of Main and Elm. ![outside of a post office](2) Its walls, painted the blue of a stormy sea, held the secrets of the town. Letters and packages passed through its doors, each carrying stories, confessions, and dreams. As Tommy entered, he noticed an envelope addressed to him in his grandfather’s familiar scrawl, postmarked from a date long past.

It was as if time had curled upon itself, delivering a message meant for another age. In the quiet of the post office, with the flag outside fluttering in the wind, Tommy opened the envelope. Inside, he found the key to the garage and a note that simply read, “Fix the unfixable, tune in to the untold, and deliver the undeliverable. The journey is yours.” It was an invitation from the past, urging him to weave his own story into the tapestry of time.

As he stepped out, the world seemed to hold its breath, waiting for Tommy to turn the key, not just of the garage, but of destiny. What secrets did the car hold? What stories would the radios tell? And what mysteries awaited delivery? Only time would tell, and it was time to begin.
`;

const exampleImages = [
	{ id: "1", dataUrl: "/demo/0.png", url: "" },
	{ id: "2", dataUrl: "/demo/1.png", url: "" },
	{ id: "3", dataUrl: "/demo/2.png", url: "" },
];

export const illustrationStyles = {
	childrensBook:
		"whimsical, watercolor, children's book illustration, soft edges, vibrant highlights, light and shadow play, dynamic perspective, expressive, anthropomorphic details, pastel background, colorful accents, imaginative scenery",
	manga: "anime, manga art kodomo style, bright colors, simple lines, clear outlines, minimal detail, vibrant settings, fantasy elements, playful designs, friendship themes",
	fantasyArt:
		"detailed, imaginative, epic, vibrant color palette, mythical themes, dynamic lighting, magical elements",
	realism:
		"high detail, accurate proportions, lifelike textures, natural lighting, depth of field, subtle color variation, realistic expressions, meticulous backgrounds, true-to-life scenes",
	graphicNovel:
		"inked lines, bold shading, sequential art, visual storytelling, cinematic framing, noir tones",
	custom: "",
};

export type IllustrationStyles = keyof typeof illustrationStyles;

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

export default function Page(_properties: InferGetStaticPropsType<typeof getStaticProps>) {
	const { t } = useTranslation(["common", "labels"]);
	const [running, setRunning] = useState(false);

	useEffect(() => {
		const unsubscribeStarted = window.ipc.on(
			buildKey([ID.LIVE_PAINT], { suffix: ":started" }),
			() => {
				setRunning(true);
			}
		);

		const unsubscribeStopped = window.ipc.on(
			buildKey([ID.LIVE_PAINT], { suffix: ":stopped" }),
			() => {
				setRunning(false);
			}
		);

		return () => {
			unsubscribeStarted();
			unsubscribeStopped();
		};
	}, []);

	useEffect(() => {
		window.ipc.send(buildKey([ID.LIVE_PAINT], { suffix: ":start" }));
		return () => {
			window.ipc.send(buildKey([ID.LIVE_PAINT], { suffix: ":stop" }));
		};
	}, []);

	return (
		<>
			<Head>
				<title>{`Captain | ${t("labels:livePainting")}`}</title>
			</Head>

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
						{t("labels:livePainting")}
					</Typography>
					<Box sx={{ flex: 1 }} />
					<Box sx={{ display: "flex", gap: 1 }}>
						<Tooltip title={running ? t("labels:stop") : t("labels:start")}>
							<IconButton
								size="lg"
								color="primary"
								variant="solid"
								data-testid="live-painting-start"
								aria-label={running ? t("labels:stop") : t("labels:start")}
								onClick={() => {
									if (running) {
										window.ipc.send(
											buildKey([ID.LIVE_PAINT], { suffix: ":stop" })
										);
									} else {
										window.ipc.send(
											buildKey([ID.LIVE_PAINT], { suffix: ":start" })
										);
									}
								}}
							>
								{running ? <StopIcon /> : <PlayArrowIcon />}
							</IconButton>
						</Tooltip>
					</Box>
				</Sheet>
				<Box
					sx={{
						flex: 1,
						position: "relative",
					}}
				>
					<CustomScrollbars>
						<LivePainting running={running} />
					</CustomScrollbars>
				</Box>
			</Stack>
		</>
	);
}

export const getStaticProps = makeStaticProperties(["common", "texts", "labels"]);

export { getStaticPaths } from "@/ions/i18n/get-static";
