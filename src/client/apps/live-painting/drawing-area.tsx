import { useSDK } from "@captn/react/use-sdk";
import Box from "@mui/joy/Box";
import { useAtom } from "jotai";
import { type PointerEvent as ReactPointerEvent, useEffect, useRef } from "react";

import { clearCounterAtom, livePaintingOptionsAtom } from "./atoms";

import { APP_ID } from "@/apps/live-painting/constants";

export function DrawingArea({ isOverlay }: { isOverlay?: boolean }) {
	const canvas = useRef<HTMLCanvasElement>(null);
	const context = useRef<CanvasRenderingContext2D | null>(null);
	const isDrawing = useRef<boolean>(false);
	const [livePaintingOptions] = useAtom(livePaintingOptionsAtom);
	const [clearCounter] = useAtom(clearCounterAtom);
	const canvasContainerReference = useRef<HTMLDivElement>(null);

	const { send } = useSDK<unknown, string>(APP_ID, {
		onMessage(message) {
			switch (message.action) {
				case "livePainting:generated": {
					break;
				}

				default: {
					break;
				}
			}
		},
	});

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

			if (context.current) {
				context.current.lineTo(event.clientX - rect.left, event.clientY - rect.top);
				context.current.stroke();
			}

			send({ action: "livePainting:dataUrl", payload: canvas.current.toDataURL() });
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
			send({ action: "livePainting:dataUrl", payload: canvas.current.toDataURL() });
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
