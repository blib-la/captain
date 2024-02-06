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

		image.addEventListener("load", () => {
			context!.clearRect(0, 0, canvas.width, canvas.height);
			context!.drawImage(image, 0, 0, canvas.width, canvas.height);
		});

		function handleImageGenerated(base64Image) {
			console.log("changed");
			image.src = `${base64Image}`;
		}

		window.ipc.on("image-generated", handleImageGenerated);
	}, []);

	return <canvas ref={canvasReference} style={{ border: "1px solid #ccc" }} />;
}
