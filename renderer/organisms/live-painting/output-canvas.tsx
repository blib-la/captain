import { useRef, useEffect, useState } from "react";

interface OutputCanvasProperties {
	width?: number;
	height?: number;
}

export function OutputCanvas({ width = 512, height = 512 }: OutputCanvasProperties) {
	const canvasReference = useRef<HTMLCanvasElement>(null);
	const [imageData, setImageData] = useState("");

	useEffect(() => {
		if (canvasReference.current) {
			const dpr = window.devicePixelRatio || 1;
			const canvas = canvasReference.current;

			canvas.width = width * dpr;
			canvas.height = height * dpr;
			canvas.style.width = `${width}px`;
			canvas.style.height = `${height}px`;
		}
	}, []);

	useEffect(() => {
		function handleImageGenerated(base64Image) {
			setImageData(base64Image);
		}

		window.ipc.on("image-generated", handleImageGenerated);

		return () => {
			//
			// window.ipc.removeListener("image-generated", handleImageGenerated);
		};
	}, []);

	useEffect(() => {
		if (imageData && canvasReference.current) {
			const canvas = canvasReference.current;
			const context = canvas.getContext("2d");

			if (context) {
				// Create a new image object
				const image = new Image();
				image.addEventListener("load", () => {
					context.clearRect(0, 0, canvas.width, canvas.height);
					context.drawImage(image, 0, 0, canvas.width, canvas.height);
				});

				image.src = `${imageData}`;
			}
		}
	}, [imageData]);

	return <canvas ref={canvasReference} style={{ border: "1px solid #ccc" }} />;
}
