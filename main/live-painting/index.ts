import fsp from "node:fs/promises";

import { BrowserWindow, ipcMain } from "electron";
import { watchFile } from "fs-extra";

import { python } from "../helpers/python";
import { getDirectory } from "../helpers/utils";

ipcMain.on("live-painting:input", (event, input) => {
	const dataString = input.toString("utf8");
	const base64Data = dataString.replace(/^data:image\/png;base64,/, "");
	const decodedImageData = Buffer.from(base64Data, "base64");

	fsp.writeFile("live-canvas-frontend-user-data.png", decodedImageData);
});

ipcMain.handle("live-painting:start", () => {
	runLivePainting();
	watchOutputFile();
});

export async function runLivePainting(): Promise<any> {
	const window_ = BrowserWindow.getFocusedWindow();
	if (!window_) {
		return;
	}

	console.log("live-painting:run");

	try {
		const pathToPythonScript = getDirectory("python", "live-painting/main.py");

		await python(
			[pathToPythonScript],
			{
				stderr(data: string) {
					console.log(`stderr ${data}`);
				},
				stdout(data: string) {
					console.log(`stdout ${data}`);
				},
			},
			process => {
				setInterval(() => {
					const data = {
						prompt: "space frog",
						seed: 123,
						strength: "1.0",
						input_path: "live-canvas-frontend-user-data.png",
						output_path: "live-canvas-generate-image-output.png",
					};

					process.stdin.write(JSON.stringify(data) + "\n");
				}, 4000);
			}
		);

		return "done";
	} catch (error) {
		console.error("Error running live-painting:", error);
		if (error instanceof Error) {
			throw new TypeError("Failed to run live-painting script. " + error.message);
		}
	} finally {
		// Do something
	}
}

function watchOutputFile() {
	const window_ = BrowserWindow.getFocusedWindow();
	if (!window_) {
		return;
	}

	console.log("watching");

	let cache = "";

	watchFile(
		"live-canvas-generate-image-output.png",
		{ interval: 33 },
		async (current, previous) => {
			if (current.mtime !== previous.mtime && window_) {
				try {
					const imageData = await fsp.readFile("live-canvas-generate-image-output.png");
					const base64Image = imageData.toString("base64");

					if (!base64Image.trim()) {
						return;
					}

					if (base64Image.trim() === cache) {
						return;
					}

					cache = base64Image;

					window_.webContents.send(
						"image-generated",
						`data:image/png;base64,${base64Image}`
					);
				} catch (error) {
					console.error("Error sending generated image:", error);
				}
			}
		}
	);
}
