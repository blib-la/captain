import { useRef, useEffect } from "react";

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
			canvas.style.width = `${width}px`;
			canvas.style.height = `${height}px`;
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

			console.log("tick");
			image.src = `${base64Image}`;
		}

		const unsubscribe = window.ipc.on("image-generated", handleImageGenerated);

		return () => {
			unsubscribe();
			image.removeEventListener("load", handleLoad);
		};
	}, []);

	return <canvas ref={canvasReference} style={{ border: "1px solid #ccc" }} />;
}
