import { ClickAwayListener } from "@mui/base";
import BrushIcon from "@mui/icons-material/Brush";
import CasinoIcon from "@mui/icons-material/Casino";
import ClearIcon from "@mui/icons-material/Clear";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import MmsIcon from "@mui/icons-material/Mms";
import PaletteIcon from "@mui/icons-material/Palette";
import PhotoFilterIcon from "@mui/icons-material/PhotoFilter";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import Box from "@mui/joy/Box";
import CircularProgress from "@mui/joy/CircularProgress";
import FormControl from "@mui/joy/FormControl";
import FormLabel from "@mui/joy/FormLabel";
import IconButton from "@mui/joy/IconButton";
import Modal from "@mui/joy/Modal";
import ModalClose from "@mui/joy/ModalClose";
import ModalDialog from "@mui/joy/ModalDialog";
import Sheet from "@mui/joy/Sheet";
import Slider from "@mui/joy/Slider";
import Stack from "@mui/joy/Stack";
import SvgIcon from "@mui/joy/SvgIcon";
import Textarea from "@mui/joy/Textarea";
import ToggleButtonGroup from "@mui/joy/ToggleButtonGroup";
import Tooltip from "@mui/joy/Tooltip";
import Typography from "@mui/joy/Typography";
import { atom, useAtom } from "jotai";
import type { InferGetStaticPropsType } from "next";
import Head from "next/head";
import { useTranslation } from "next-i18next";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useRef, useState } from "react";

import { buildKey } from "#/build-key";
import { ID } from "#/enums";
import { makeStaticProperties } from "@/ions/i18n/get-static";
import { getContrastColor } from "@/ions/utils/color";
import { CustomScrollbars } from "@/organisms/custom-scrollbars";
export type ViewType = "side-by-side" | "overlay";
const livePaintingOptionsAtom = atom({
	brushSize: 10,
	color: "#20827c",
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

			console.log("ing");

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

const imageAtom = atom(
	"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP4//8/AAX+Av4N70a4AAAAAElFTkSuQmCC"
);

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
		<Box sx={{ bgcolor: "background.body", width: 512, height: 512, display: "flex" }}>
			<img height={512} width={512} src={image} alt="" />
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

function randomSeed() {
	return Math.ceil(Math.random() * 1_000_000_000) + 1;
}

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
	const [prompt, setPrompt] = useState("a captain with white beard, teal hat and uniform");
	const [storyModalOpen, setStoryModalOpen] = useState(false);
	const [storyTooltipOpen, setStoryTooltipOpen] = useState(false);
	const [seed, setSeed] = useState(randomSeed());
	const isOverlay = value === "overlay";

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
			}
		);
		return () => {
			unsubscribeStoryGenerated();
			unsubscribeApiKey();
		};
	}, []);

	useEffect(() => {
		if (running) {
			window.ipc.send(buildKey([ID.LIVE_PAINT], { suffix: ":settings" }), { prompt, seed });
		}
	}, [prompt, seed, running]);

	return (
		<Box sx={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column" }}>
			<Modal
				open={storyModalOpen}
				onClose={() => {
					setStoryModalOpen(false);
				}}
			>
				<ModalDialog sx={{ width: "80%", maxWidth: 1440 }}>
					<ModalClose aria-label={t("labels:close")} />
					<Box sx={{ mt: 4, width: "100%", overflow: "auto" }}>
						<Box
							component="img"
							src={image}
							sx={{
								my: 2,
								mr: 2,
								float: "left",
								width: "50%",
								maxWidth: 512,
								height: "auto",
							}}
						/>
						<Typography sx={{ whiteSpace: "pre-wrap", width: "100%" }}>
							{story}
						</Typography>
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
					px: 1,
					gap: 1,
				}}
			>
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
				<Box sx={{ width: 8 }} />
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
				<Tooltip open={storyTooltipOpen} title={t("labels:createStory")}>
					<IconButton
						disabled={generatingStory || !openAiApiKey}
						size="md"
						variant="soft"
						aria-label={t("labels:createStory")}
						onFocus={() => {
							setStoryTooltipOpen(true);
						}}
						onBlur={() => {
							setStoryTooltipOpen(false);
						}}
						onMouseEnter={() => {
							setStoryTooltipOpen(true);
						}}
						onMouseLeave={() => {
							setStoryTooltipOpen(false);
						}}
						onClick={() => {
							setGeneratingStory(true);
							setStoryTooltipOpen(false);
							window.ipc.send(buildKey([ID.STORY], { suffix: ":describe" }), {
								images: [image],
								prompt: `{"lang": "${locale}"}`,
							});
						}}
					>
						{generatingStory ? <CircularProgress /> : <MmsIcon />}
					</IconButton>
				</Tooltip>
				<Tooltip title={t("labels:readStory")}>
					<IconButton
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
			</Sheet>
			<Box
				sx={{ flex: 1, rowGap: 2, display: "flex", flexWrap: "wrap", position: "relative" }}
			>
				<Box
					sx={{
						width: {
							xs: "100%",
							md: isOverlay ? "100%" : "50%",
						},
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
			</Box>
			<Sheet sx={{ px: 1, py: 2 }}>
				<FormControl>
					<FormLabel>{t("labels:prompt")}</FormLabel>
					<Textarea
						minRows={3}
						maxRows={3}
						value={prompt}
						onChange={event => {
							setPrompt(event.target.value);
						}}
					/>
				</FormControl>
			</Sheet>
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
