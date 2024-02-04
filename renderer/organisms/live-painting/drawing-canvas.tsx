import Brush from "@mui/icons-material/Brush";
import Clear from "@mui/icons-material/Clear";
import IconButton from "@mui/joy/IconButton";
import Input from "@mui/joy/Input";
import Stack from "@mui/joy/Stack";
import { Box } from "@mui/material";
import type { MouseEvent } from "react";
import { useRef, useEffect, useState, useCallback } from "react";

interface DrawingCanvasProperties {
	width?: number;
	height?: number;
}

export function DrawingCanvas({ width = 512, height = 512 }: DrawingCanvasProperties) {
	const offscreenCanvasReference = useRef<OffscreenCanvas | null>(null);
	const canvasReference = useRef<HTMLCanvasElement>(null);
	const [isDrawing, setIsDrawing] = useState(false);
	const [strokeColor, setStrokeColor] = useState("#000000");
	const [brushSize, setBrushSize] = useState(10);
	const [backgroundColor, setBackgroundColor] = useState("transparent");
	const animationFrameId = useRef<number>(0);

	const videoCanvasReference = useRef<HTMLCanvasElement>(null);
	const videoReference = useRef<HTMLVideoElement>(null);
	const [videoSource, setVideoSource] = useState<string | null>();
	const [isPlaying, setIsPlaying] = useState(false);

	useEffect(() => {
		const dpr = window.devicePixelRatio || 1;
		offscreenCanvasReference.current = new OffscreenCanvas(width * dpr, height * dpr);
	}, [width, height]);

	const loadVideo = useCallback((source: string) => {
		const video = videoReference.current;

		if (video) {
			video.src = source;
			video.load();
			video.loop = true;
			video.play();
			setVideoSource(source);
			setBackgroundColor("transparent");
		}
	}, []);

	function renderVideoFrame() {
		if (!videoCanvasReference.current || !videoReference.current) {
			return;
		}

		const canvas = videoCanvasReference.current;
		const context = canvas.getContext("2d");
		const video = videoReference.current;

		// Render the current frame of the video onto the canvas
		if (context && video.readyState >= 3) {
			context.drawImage(video, 0, 0, canvas.width, canvas.height);
		}
	}

	function startDrawing({ nativeEvent }: MouseEvent) {
		const { offsetX, offsetY } = nativeEvent;
		const context = canvasReference.current?.getContext("2d");
		if (context) {
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
		if (!isDrawing) {
			return;
		}

		const { offsetX, offsetY } = nativeEvent;
		const context = canvasReference.current?.getContext("2d");
		if (context) {
			context.strokeStyle = strokeColor;
			context.lineWidth = brushSize;
			context.lineTo(offsetX, offsetY);
			context.stroke();
		}
	}

	async function captureAndSendCanvasData() {
		const videoCanvas = videoCanvasReference.current;
		const drawingCanvas = canvasReference.current;
		const offscreenCanvas = offscreenCanvasReference.current;

		if (videoCanvas) {
			renderVideoFrame();
		}

		if (videoCanvas && drawingCanvas && offscreenCanvas) {
			const offscreenContext = offscreenCanvas.getContext("2d");

			if (offscreenContext) {
				// Clear the off-screen canvas
				offscreenContext.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);

				// Draw the video canvas onto the off-screen canvas
				offscreenContext.drawImage(videoCanvas, 0, 0);

				// Draw the drawing canvas onto the off-screen canvas
				offscreenContext.drawImage(drawingCanvas, 0, 0);

				// Convert the combined image to a blob
				// const blob = await offscreenCanvas.convertToBlob();
				// Window.ipc.send("live-painting:input", blob);
				// SendCanvasData(blob);

				const data = drawingCanvas.toDataURL();
				window.ipc.send("live-painting:input", data);

				//
				// drawingCanvas.toBlob(blob => {
				// 	if (blob) {
				// 		window.ipc.send("live-painting:input", "blob");
				// 	}
				// }, "image/jpeg");

				//
				// drawingCanvas.toBlob(blob => {
				// 	if (blob) {
				// 		sendCanvasData(blob);
				// 	}
				// }, "image/png");
			}
			// Const data = canvasReference.current.toDataURL();
			// sendCanvasData(data);
		}

		animationFrameId.current = requestAnimationFrame(captureAndSendCanvasData);
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
		if (canvasReference.current) {
			const dpr = window.devicePixelRatio || 1;
			const canvas = canvasReference.current;

			canvas.width = width * dpr;
			canvas.height = height * dpr;
			canvas.style.width = `${width}px`;
			canvas.style.height = `${height}px`;

			const context = canvas.getContext("2d");
			if (context) {
				context.scale(dpr, dpr);
				context.fillStyle = backgroundColor;
				context.fillRect(0, 0, canvas.width, canvas.height);
				context.lineCap = "round";
				context.strokeStyle = strokeColor;
				context.lineWidth = brushSize;
			}

			animationFrameId.current = requestAnimationFrame(captureAndSendCanvasData);
		}

		if (videoCanvasReference.current) {
			const dpr = window.devicePixelRatio || 1;
			const canvas = videoCanvasReference.current;

			canvas.width = width * dpr;
			canvas.height = height * dpr;
			canvas.style.width = `${width}px`;
			canvas.style.height = `${height}px`;

			const context = canvas.getContext("2d");
			if (context) {
				context.fillStyle = "#fff";
				context.fillRect(0, 0, canvas.width, canvas.height);
			}
		}

		return () => {
			if (animationFrameId.current) {
				cancelAnimationFrame(animationFrameId.current);
			}
		};
	}, []);

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
					onChange={event => setStrokeColor(event.target.value)}
				/>

				<Input
					type="number"
					value={brushSize}
					placeholder="pencil size"
					sx={{ width: 100 }}
					startDecorator={<Brush sx={{ height: 15 }} />}
					slotProps={{ input: { min: 0 } }}
					onChange={event => setBrushSize(Number.parseInt(event.target.value, 10))}
				/>

				<IconButton onClick={clearCanvas}>
					<Clear />
				</IconButton>

				{/* <input
					type="file"
					accept="video/*"
					onChange={event => {
						if (event.target.files && event.target.files[0]) {
							loadVideo(URL.createObjectURL(event.target.files[0]));
						}
					}}
				/>
				<video ref={videoReference} style={{ display: "none" }} /> */}
			</Stack>

			<Box sx={{ width, height }}>
				<canvas
					ref={videoCanvasReference}
					style={{
						position: "absolute",
						border: "1px solid #ccc",
						cursor: "none",
					}}
				/>
				<canvas
					ref={canvasReference}
					style={{
						position: "absolute",
						border: "1px solid #ccc",
						cursor: "crosshair",
						zIndex: 1337,
					}}
					onMouseDown={startDrawing}
					onMouseUp={finishDrawing}
					onMouseMove={draw}
				/>
			</Box>
		</Stack>
	);
}
