import { useSDK } from "@captn/react/use-sdk";
import Box from "@mui/joy/Box";
import { useAtom } from "jotai";
import { type PointerEvent as ReactPointerEvent, useEffect, useRef } from "react";

import { clearCounterAtom, livePaintingOptionsAtom } from "./atoms";
import { APP_ID, FRAMES_PER_SECOND } from "./constants";

export function DrawingArea({ isOverlay }: { isOverlay?: boolean }) {
	const canvas = useRef<HTMLCanvasElement>(null);
	const context = useRef<CanvasRenderingContext2D | null>(null);
	const isDrawing = useRef<boolean>(false);
	const [livePaintingOptions] = useAtom(livePaintingOptionsAtom);
	const [clearCounter] = useAtom(clearCounterAtom);
	const canvasContainerReference = useRef<HTMLDivElement>(null);
	const canvasRenderCacheReference = useRef<null | string>(null);
	const canvasRenderReference = useRef("");

	const { send } = useSDK<unknown, object>(APP_ID, {});
	function startDrawing(event: ReactPointerEvent) {
		if (!canvas.current) {
			return;
		}

		context.current ??= canvas.current.getContext("2d");
		isDrawing.current = true;
		const rect = canvas.current.getBoundingClientRect();

		if (context.current) {
			context.current.beginPath();
			context.current.moveTo(event.clientX - rect.left, event.clientY - rect.top);
		}
	}

	useEffect(() => {
		const canvasElement = canvas.current;
		let animationFrame: number;
		let timeoutId: number | null = null;
		const uploadInterval = 1000 / FRAMES_PER_SECOND;
		const pointer = { x: 0, y: 0 };
		const dpr = window.devicePixelRatio || 1;

		if (canvasElement) {
			canvasElement.height = 512 * dpr;
			canvasElement.width = 512 * dpr;
			context.current ??= canvasElement.getContext("2d");

			if (context.current) {
				context.current.scale(dpr, dpr);
				context.current.fillStyle = "#ffffff";
				context.current.rect(0, 0, canvasElement.width, canvasElement.height);
				context.current.fill();

				context.current.lineJoin = "round";
				context.current.lineCap = "round";
			}
		}

		function draw() {
			if (canvasElement && context.current && isDrawing.current) {
				context.current.lineTo(pointer.x, pointer.y);
				context.current.stroke();
				canvasRenderReference.current = canvasElement.toDataURL();
			}
		}

		function handleMouseUp() {
			isDrawing.current = false;
			if (context.current) {
				context.current.closePath();
			}

			cancelAnimationFrame(animationFrame);
			if (timeoutId !== null) {
				clearTimeout(timeoutId);
				timeoutId = null;
			}
		}

		function handleMouseMove(event: MouseEvent) {
			if (canvasElement) {
				const rect = canvasElement.getBoundingClientRect();
				pointer.x = event.clientX - rect.left;
				pointer.y = event.clientY - rect.top;
			}

			if (canvasContainerReference.current) {
				canvasContainerReference.current.style.setProperty("--brushX", `${pointer.x}px`);
				canvasContainerReference.current.style.setProperty("--brushY", `${pointer.y}px`);
			}

			if (
				timeoutId === null &&
				canvasRenderReference.current &&
				canvasRenderCacheReference.current !== canvasRenderReference.current
			) {
				canvasRenderCacheReference.current = canvasRenderReference.current;
				timeoutId = window.setTimeout(() => {
					send({
						action: "comfyui:upload-image",
						payload: { dataURL: canvasRenderReference.current },
					});
					timeoutId = null;
				}, uploadInterval);
			}

			animationFrame = requestAnimationFrame(draw);
		}

		document.addEventListener("mousemove", handleMouseMove, { passive: true });
		document.addEventListener("mouseup", handleMouseUp);

		return () => {
			document.removeEventListener("mousemove", handleMouseMove);
			document.removeEventListener("mouseup", handleMouseUp);
			cancelAnimationFrame(animationFrame);
			if (timeoutId !== null) {
				clearTimeout(timeoutId);
				timeoutId = null;
			}
		};
	}, [send]);

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
			send({
				action: "comfyui:upload-image",
				payload: { dataURL: canvas.current.toDataURL() },
			});
		}
	}, [send, clearCounter]);

	return (
		<Box
			ref={canvasContainerReference}
			sx={{
				width: 512,
				height: 512,
				boxShadow: isOverlay ? undefined : "sm",
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
