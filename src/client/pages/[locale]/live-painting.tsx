import Box from "@mui/joy/Box";
import Button from "@mui/joy/Button";
import Sheet from "@mui/joy/Sheet";
import Stack from "@mui/joy/Stack";
import ToggleButtonGroup from "@mui/joy/ToggleButtonGroup";
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

export type ViewType = "side-by-side" | "overlay";

const imageAtom = atom("");

function DrawingArea() {
	const canvas = useRef<HTMLCanvasElement>(null);
	const context = useRef<CanvasRenderingContext2D | null>(null);
	const isDrawing = useRef<boolean>(false);
	const [, setImage] = useAtom(imageAtom);

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

		canvasElement.height = 512;
		canvasElement.width = 512;
		context.current = canvasElement.getContext("2d");

		function draw(event: MouseEvent) {
			if (!isDrawing.current || !canvas.current) {
				return;
			}

			const rect = canvas.current.getBoundingClientRect();
			context.current?.lineTo(event.clientX - rect.left, event.clientY - rect.top);
			context.current?.stroke();
			const dataUrl = canvas.current.toDataURL();
			setImage(dataUrl);
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
			context.current.strokeStyle = "#000000";
			context.current.lineWidth = 5;
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
	}, [setImage]);

	return (
		<Box sx={{ bgcolor: "background.body", width: 512, height: 512 }}>
			<canvas ref={canvas} onPointerDown={startDrawing} />
		</Box>
	);
}

function RenderingArea() {
	const [image, setImage] = useState("");

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
	}, []);
	return (
		<Box sx={{ bgcolor: "background.body", width: 512, height: 512, display: "flex" }}>
			<img height={512} width={512} src={image} alt="" />
		</Box>
	);
}

export function LivePainting() {
	const [value, setValue] = useState<ViewType>("side-by-side");
	const isOverlay = value === "overlay";
	return (
		<Box sx={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column" }}>
			<Sheet>
				<ToggleButtonGroup
					value={value}
					onChange={(event, newValue) => {
						if (newValue) {
							setValue(newValue);
						}
					}}
				>
					<Button value="side-by-side">Side by Side</Button>
					<Button value="overlay">Overlay</Button>
				</ToggleButtonGroup>
			</Sheet>
			<Box sx={{ flex: 1, bgcolor: "red", display: "flex", position: "relative" }}>
				<Box
					sx={{
						width: isOverlay ? "100%" : "50%",
						position: isOverlay ? "absolute" : "relative",
						inset: 0,
						bgcolor: "blue",
						zIndex: 1,
						opacity: isOverlay ? 0 : 1,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<DrawingArea />
				</Box>
				<Box
					sx={{
						width: isOverlay ? "100%" : "50%",
						position: "relative",
						flex: isOverlay ? 1 : undefined,
						bgcolor: "yellow",
						zIndex: 0,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<RenderingArea />
				</Box>
			</Box>
		</Box>
	);
}

export default function Page(_properties: InferGetStaticPropsType<typeof getStaticProps>) {
	const { t } = useTranslation(["common", "labels"]);
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
						px: 2,
						zIndex: 1,
					}}
				>
					<Typography level="h4" component="h1">
						{t("labels:livePainting")}
					</Typography>
					<Box sx={{ flex: 1 }} />
					<Box sx={{ display: "flex", gap: 1 }}>
						<Button
							data-testid="live-painting-start"
							onClick={() => {
								window.ipc.send(buildKey([ID.LIVE_PAINT], { suffix: ":start" }));
							}}
						>
							Start
						</Button>
						<Button
							onClick={() => {
								window.ipc.send(buildKey([ID.LIVE_PAINT], { suffix: ":stop" }));
							}}
						>
							Stop
						</Button>
					</Box>
				</Sheet>
				<Box
					sx={{
						flex: 1,
						position: "relative",
					}}
				>
					<LivePainting />
				</Box>
			</Stack>
		</>
	);
}

export const getStaticProps = makeStaticProperties(["common", "texts", "labels"]);

export { getStaticPaths } from "@/ions/i18n/get-static";
