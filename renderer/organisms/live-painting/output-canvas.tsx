import Box from "@mui/joy/Box";
import Stack from "@mui/joy/Stack";
import { useRef, useEffect } from "react";

import { UpdateProperties } from "@/organisms/live-painting/update-properties";

interface OutputCanvasProperties {
	width?: number;
	height?: number;
}

export function OutputCanvas({ width = 512, height = 512 }: OutputCanvasProperties) {
	const canvasReference = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		if (canvasReference.current) {
			const dpr = window.devicePixelRatio || 1;
			const canvas = canvasReference.current;

			canvas.width = width * dpr;
			canvas.height = height * dpr;
		}
	}, [height, width]);

	useEffect(() => {
		const image = new Image();

		if (!canvasReference.current) {
			return;
		}

		const canvas = canvasReference.current;
		const context = canvas.getContext("2d");

		function handleLoad() {
			context!.drawImage(image, 0, 0, canvas.width, canvas.height);
		}

		image.addEventListener("load", handleLoad);

		function handleImageGenerated(base64Image: string) {
			if (!base64Image.trim() || image.src === base64Image) {
				return;
			}

			image.src = `${base64Image}`;
		}

		const unsubscribe = window.ipc.on("image-generated", handleImageGenerated);

		return () => {
			unsubscribe();
			image.removeEventListener("load", handleLoad);
		};
	}, []);

	return (
		<Stack spacing={1} sx={{ alignItems: "center" }}>
			<UpdateProperties />
			<Box
				ref={canvasReference}
				component="canvas"
				sx={{ bgcolor: "white", mx: "auto", aspectRatio: 1, width: "100%" }}
			/>
		</Stack>
	);
}
