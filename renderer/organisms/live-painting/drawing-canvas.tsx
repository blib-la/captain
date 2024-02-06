import Brush from "@mui/icons-material/Brush";
import Clear from "@mui/icons-material/Clear";
import IconButton from "@mui/joy/IconButton";
import Input from "@mui/joy/Input";
import Stack from "@mui/joy/Stack";
import { Box } from "@mui/material";
import type { MouseEvent } from "react";
import { useRef, useEffect, useState } from "react";

interface DrawingCanvasProperties {
	width?: number;
	height?: number;
}

export function DrawingCanvas({ width = 512, height = 512 }: DrawingCanvasProperties) {
	const canvasReference = useRef<HTMLCanvasElement>(null);
	const [isDrawing, setIsDrawing] = useState(false);
	const [strokeColor, setStrokeColor] = useState("#00ff00");
	const [brushSize, setBrushSize] = useState(30);
	const [backgroundColor] = useState("transparent");
	const brushReference = useRef<HTMLDivElement>(null);

	function startDrawing({ nativeEvent }: MouseEvent) {
		const context = canvasReference.current?.getContext("2d");
		if (context) {
			const { offsetX, offsetY } = nativeEvent;
			context.strokeStyle = strokeColor;
			context.lineWidth = brushSize;
			context.beginPath();
			context.moveTo(offsetX, offsetY);
			setIsDrawing(true);
		}
	}

	function finishDrawing() {
		const context = canvasReference.current?.getContext("2d");
		if (context) {
			context.closePath();
			setIsDrawing(false);
		}
	}

	function draw({ nativeEvent }: MouseEvent) {
		const { offsetX, offsetY } = nativeEvent;
		if (brushReference.current) {
			brushReference.current.style.transform = `translate3d(calc(${offsetX}px - 50%), calc(${offsetY}px - 50%), 0)`;
		}

		if (!isDrawing) {
			return;
		}

		const context = canvasReference.current?.getContext("2d");
		if (context) {
			context.strokeStyle = strokeColor;
			context.lineWidth = brushSize;
			context.lineTo(offsetX, offsetY);
			context.stroke();
		}
	}

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
				context.scale(dpr, dpr);
			}

			animationFrameId = requestAnimationFrame(captureAndSendCanvasData);
		}

		return () => {
			cancelAnimationFrame(animationFrameId);
		};
	}, [height, width]);

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
		<Stack direction="row" spacing={2}>
			<Stack spacing={2}>
				<Input
					type="color"
					value={strokeColor}
					sx={{
						"--Input-paddingInline": "0px",
						p: 0.5,
						"--Input-minHeight": "10px",
					}}
					onChange={event => {
						setStrokeColor(event.target.value);
					}}
				/>

				<Input
					type="number"
					value={brushSize}
					placeholder="pencil size"
					sx={{ width: 100 }}
					startDecorator={<Brush sx={{ height: 15 }} />}
					slotProps={{ input: { min: 0 } }}
					onChange={event => {
						setBrushSize(Number.parseInt(event.target.value, 10));
					}}
				/>

				<IconButton onClick={clearCanvas}>
					<Clear />
				</IconButton>
			</Stack>

			<Box sx={{ position: "relative" }} style={{ width, height }}>
				<Box
					ref={canvasReference}
					component="canvas"
					sx={{
						position: "absolute",
						border: "1px solid #ccc",
						cursor: "none",
						zIndex: 2,
						width: "100%",
						height: "100%",
					}}
					onMouseDown={startDrawing}
					onMouseUp={finishDrawing}
					onMouseMove={draw}
				/>
				<Box
					ref={brushReference}
					sx={{
						position: "absolute",
						top: 0,
						left: 0,
						outline: "1px solid orange",
						zIndex: 3,
						pointerEvents: "none",
						borderRadius: "50%",
					}}
				/>
			</Box>
		</Stack>
	);
}
