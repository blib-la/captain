import { ClickAwayListener } from "@mui/base";
import BrushIcon from "@mui/icons-material/Brush";
import CircleIcon from "@mui/icons-material/Circle";
import ClearIcon from "@mui/icons-material/Clear";
import IconButton from "@mui/joy/IconButton";
import Slider from "@mui/joy/Slider";
import Stack from "@mui/joy/Stack";
import SvgIcon from "@mui/joy/SvgIcon";
import Tooltip from "@mui/joy/Tooltip";
import { Box } from "@mui/material";
import type { MouseEvent as ReactMouseEvent } from "react";
import { useRef, useEffect, useState } from "react";
interface DrawingCanvasProperties {
	width?: number;
	height?: number;
}

export function CircleSmallIcon() {
	return (
		<SvgIcon>
			<path d="M12,10A2,2 0 0,0 10,12C10,13.11 10.9,14 12,14C13.11,14 14,13.11 14,12A2,2 0 0,0 12,10Z" />
		</SvgIcon>
	);
}

export function DrawingCanvas({ width = 512, height = 512 }: DrawingCanvasProperties) {
	const canvasReference = useRef<HTMLCanvasElement>(null);
	const [optionsOpen, setOptionsOpen] = useState(false);
	const [isBrushVisible, setIsBrushVisible] = useState(false);
	const [strokeColor, setStrokeColor] = useState("#000000");
	const [brushSize, setBrushSize] = useState(10);
	const [backgroundColor] = useState("#ffffff");
	const brushReference = useRef<HTMLDivElement>(null);

	function handlePointerDown({ nativeEvent }: ReactMouseEvent) {
		const canvas = canvasReference.current;
		const context = canvas?.getContext("2d");
		if (!context || !canvas) {
			return;
		}

		// Calculate scale factors
		const rect = canvas.getBoundingClientRect();
		const scaleX = canvas.width / rect.width; // Scale factor for width
		const scaleY = canvas.height / rect.height; // Scale factor for height

		const { offsetX, offsetY } = nativeEvent;
		// Adjust coordinates according to scale
		const x = offsetX * scaleX;
		const y = offsetY * scaleY;

		context.strokeStyle = strokeColor; // Ensure strokeColor is defined somewhere in your component
		context.lineWidth = brushSize; // Ensure brushSize is defined somewhere in your component
		context.beginPath();
		context.moveTo(x, y);

		function handlePointerMove(event: MouseEvent) {
			// Adjust mouse move event coordinates
			const mouseX = (event.clientX - rect.left) * scaleX;
			const mouseY = (event.clientY - rect.top) * scaleY;

			if (brushReference.current) {
				// Adjust brush position for display, not for drawing calculations
				brushReference.current.style.transform = `translate3d(calc(${event.clientX - rect.left}px - 50%), calc(${event.clientY - rect.top}px - 50%), 0)`;
			}

			if (!context) {
				return;
			}

			context.lineTo(mouseX, mouseY);
			context.stroke();
		}

		function handlePointerUp() {
			window.removeEventListener("pointermove", handlePointerMove);
			window.removeEventListener("pointerup", handlePointerUp);
			window.removeEventListener("pointerleave", handlePointerUp);
			if (!context) {
				return;
			}

			context.closePath();
		}

		window.addEventListener("pointermove", handlePointerMove);
		window.addEventListener("pointerup", handlePointerUp);
		window.addEventListener("pointerleave", handlePointerUp);
	}

	function handlePointerMove({ nativeEvent }: ReactMouseEvent) {
		const { offsetX, offsetY } = nativeEvent;
		if (brushReference.current) {
			brushReference.current.style.transform = `translate3d(calc(${offsetX}px - 50%), calc(${offsetY}px - 50%), 0)`;
		}
	}

	function handlePointerLeave() {
		setIsBrushVisible(false);
	}

	function handlePointerEnter() {
		setIsBrushVisible(true);
	}

	// You no longer need a separate handlePointerMove function declared outside
	// since it's defined and used within handlePointerDown.

	function clearCanvas() {
		if (canvasReference.current) {
			const canvas = canvasReference.current;
			const context = canvas?.getContext("2d");

			if (context) {
				context.clearRect(0, 0, canvas.width, canvas.height);
				context.fillStyle = backgroundColor;
				context.fillRect(0, 0, canvas.width, canvas.height);
			}
		}
	}

	useEffect(() => {
		// Keep this function local to this side effect
		// it simplifies the usage and reduces the number of required hooks
		let animationFrameId: number;
		async function captureAndSendCanvasData() {
			const drawingCanvas = canvasReference.current;

			if (drawingCanvas) {
				const data = drawingCanvas.toDataURL();
				window.ipc.send("live-painting:input", data);
			}

			animationFrameId = requestAnimationFrame(captureAndSendCanvasData);
		}

		if (canvasReference.current) {
			const dpr = window.devicePixelRatio || 1;
			const canvas = canvasReference.current;

			canvas.width = width * dpr;
			canvas.height = height * dpr;

			const context = canvas.getContext("2d");
			if (context) {
				context.clearRect(0, 0, canvas.width, canvas.height);
				context.fillStyle = backgroundColor;
				context.fillRect(0, 0, canvas.width, canvas.height);
				context.scale(dpr, dpr);
			}

			animationFrameId = requestAnimationFrame(captureAndSendCanvasData);
		}

		return () => {
			cancelAnimationFrame(animationFrameId);
		};
	}, [backgroundColor, height, width]);

	// Only handle adjustments here
	// Never paint in this side effect
	useEffect(() => {
		if (brushReference.current) {
			brushReference.current.style.width = `${brushSize}px`;
			brushReference.current.style.height = `${brushSize}px`;
		}

		if (canvasReference.current) {
			const canvas = canvasReference.current;

			const context = canvas.getContext("2d");
			if (context) {
				context.fillStyle = backgroundColor;
				context.lineCap = "round";
				context.lineJoin = "round"; // This makes the corner round
				context.strokeStyle = strokeColor;
				context.lineWidth = brushSize;
			}
		}
	}, [backgroundColor, brushSize, strokeColor]);

	return (
		<Stack spacing={1} sx={{ position: "relative", alignItems: "center" }}>
			<Box
				sx={{
					width: "100%",
					height: 36,
					display: "flex",
					gap: 1,
					alignItems: "flex-end",
				}}
			>
				<IconButton
					component="label"
					sx={theme => ({
						bgcolor: strokeColor,
						cursor: "pointer",
						boxShadow: `0 0 0 2px ${theme.palette.divider}`,
						"&:hover": { bgcolor: strokeColor },
						input: {
							minWidth: "100%",
							width: "100%",
							opacity: 0,
							cursor: "pointer",
						},
					})}
				>
					<input
						type="color"
						value={strokeColor}
						onChange={event => {
							setStrokeColor(event.target.value);
						}}
					/>
				</IconButton>
				<ClickAwayListener
					onClickAway={() => {
						setOptionsOpen(false);
					}}
				>
					<Tooltip
						disableInteractive={false}
						open={optionsOpen}
						placement="right-end"
						title={
							<Box>
								<Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
									<Box
										sx={{
											flexShrink: 0,
											display: "flex",
											alignItems: "center",
										}}
									>
										<CircleSmallIcon />
									</Box>
									<Slider
										value={brushSize}
										min={1}
										max={50}
										step={1}
										sx={{ minWidth: 200 }}
										onChange={(event, value) => {
											setBrushSize(value as number);
										}}
									/>
									<Box
										sx={{
											flexShrink: 0,
											display: "flex",
											alignItems: "center",
										}}
									>
										<CircleIcon />
									</Box>
								</Box>
							</Box>
						}
					>
						<IconButton
							onClick={() => {
								setOptionsOpen(previousValue => !previousValue);
							}}
						>
							<BrushIcon />
						</IconButton>
					</Tooltip>
				</ClickAwayListener>
				<Box sx={{ flex: 1 }} />
				<IconButton onClick={clearCanvas}>
					<ClearIcon />
				</IconButton>
			</Box>
			<Box sx={{ position: "relative", aspectRatio: 1, width: "100%" }}>
				<Box
					ref={canvasReference}
					component="canvas"
					sx={{
						position: "absolute",
						inset: 0,
						cursor: "none",
						zIndex: 2,
						width: "100%",
						height: "100%",
					}}
					onPointerDown={handlePointerDown}
					onPointerMove={handlePointerMove}
					onPointerLeave={handlePointerLeave}
					onPointerEnter={handlePointerEnter}
				/>
				<Box
					ref={brushReference}
					sx={{
						position: "absolute",
						top: 0,
						left: 0,
						zIndex: 3,
						pointerEvents: "none",
						borderRadius: "50%",
						mixBlendMode: "difference",
						border: "2px solid white",
					}}
					style={{
						// BackgroundColor: strokeColor,
						display: isBrushVisible ? undefined : "none",
					}}
				/>
			</Box>
		</Stack>
	);
}
