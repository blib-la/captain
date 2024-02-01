import fsp from "fs/promises";
import path from "path";

import type { AxiosError } from "axios";
import { BrowserWindow } from "electron";
import { OpenAI } from "openai";
import type { ChatCompletionContentPart } from "openai/resources/chat/completions";

import { CAPTION_RUNNING, OPENAI_API_KEY } from "./constants";
import { python } from "./python";
import { store } from "./store";
import { getDirectory, getImageFiles, parseJsonFromString } from "./utils";

function parseCaptionLogs(data: string) {
	try {
		const [percentString, , slug] = data.trim().split("|");
		const percent = Number.parseFloat(percentString);
		console.log("python-data-stderr ---->>>>>>>>>>", percent, slug);
		const [progressCount_] = slug.trim().split("[");
		console.log("python-data-stderr ---->>>>>>>>>>", {
			percent,
			slug,
			progressCount_,
		});
		const [completedCount, totalCount] = progressCount_.trim().split("/");
		return { percent, completedCount, totalCount };
	} catch (error) {
		console.log(error);
	}
}

export async function runBlip(directory: string): Promise<any> {
	const window_ = BrowserWindow.getFocusedWindow();
	if (!window_) {
		return;
	}

	try {
		const pathToPythonScript = getDirectory("python", "caption_blip.py");

		await python([pathToPythonScript, directory, "--caption_extension", ".txt"], {
			stderr(data: string) {
				window_.webContents.send("caption-progress", parseCaptionLogs(data));
			},
		});

		return "done";
	} catch (error) {
		console.error("Error running BLIP:", error);
		if (error instanceof Error) {
			throw new TypeError("Failed to run BLIP script. " + error.message);
		}
	} finally {
		store.set(CAPTION_RUNNING, false);
	}
}

export async function runWd14(directory: string) {
	const window_ = BrowserWindow.getFocusedWindow();
	if (!window_) {
		return;
	}

	try {
		const pathToPythonScript = getDirectory("python", "caption_wd14.py");
		await python(
			[pathToPythonScript, directory, "--caption_extension", ".txt", "--remove_underscore"],
			{
				stderr(data: string) {
					window_.webContents.send("caption-progress", parseCaptionLogs(data));
				},
			}
		);
		return "done";
	} catch (error) {
		console.error(error);
		throw new Error("Failed to run WD14 script.");
	} finally {
		store.set(CAPTION_RUNNING, false);
	}
}

export async function createImageDescriptions(
	images: string[],
	{ systemMessage, exampleResponse }: { systemMessage: string; exampleResponse: string }
) {
	const openai = new OpenAI({
		apiKey: store.get(OPENAI_API_KEY) as string,
	});
	const imageContents: ChatCompletionContentPart[] = images.map(image => ({
		type: "image_url",
		image_url: { url: `data:image/png;base64,${image}` },
	}));

	const response = await openai.chat.completions.create({
		model: "gpt-4-vision-preview",
		messages: [
			{ role: "system", content: systemMessage },
			{
				role: "user",
				content: [],
			},
			{
				role: "assistant",
				content: `
\`\`\`json
${exampleResponse}
\`\`\`
`,
			},
			{
				role: "user",
				content: imageContents,
			},
		],
		max_tokens: 1000,
	});

	console.log("\n\nGPT RESULT: -->\n");
	console.log(response.choices[0].message.content);
	console.log("\n--------------------\n\n");
	return parseJsonFromString(response.choices[0].message.content!);
}

export async function runGPTV(
	directory: string,
	{
		batchSize = 5,
		exampleResponse,
		guidelines,
	}: {
		batchSize?: number;
		exampleResponse: string;
		guidelines: string;
	}
) {
	console.log(batchSize);
	const window_ = BrowserWindow.getFocusedWindow();
	if (!window_) {
		return;
	}

	const imageFiles = getImageFiles(directory);

	window_.webContents.send("caption-progress", {
		percent: 0,
		completedCount: 0,
		totalCount: imageFiles.length,
	});
	for (let index = 0; index < imageFiles.length; index += batchSize) {
		console.log(`>>>> running batch ${index + 1} of ${imageFiles.length}`);
		const batch = imageFiles.slice(index, index + batchSize);
		const imageDescriptions = [];

		for (const file of batch) {
			const imagePath = path.join(directory, file);
			const buffer = await fsp.readFile(imagePath, "base64");
			imageDescriptions.push(buffer);
		}

		// Generate descriptions for the batch of images
		try {
			const descriptions = await createImageDescriptions(imageDescriptions, {
				systemMessage: `## GUIDELINES
Follow these guideline precisely:

${guidelines}

> Submit a valid JSON code block (see EXAMPLE RESPONSE)

## EXAMPLE RESPONSE

\`\`\`json
["...", "..."]
\`\`\`
`,
				exampleResponse,
			});
			// Write descriptions to corresponding text files
			await Promise.all(
				batch.map(async (file, index) => {
					const textFilePath = path.join(
						directory,
						file.replace(/\.(jpg|jpeg|png)$/i, ".txt")
					);
					// Copy the original image file to the output directory with the new name
					await fsp.writeFile(textFilePath, descriptions[index].toLowerCase(), "utf8");
					console.log(`Description for ${file} written to ${textFilePath}`);
				})
			);
			const completedCount = index + batchSize;
			const percent = (completedCount / imageFiles.length) * 100;
			window_.webContents.send("caption-progress", {
				percent,
				completedCount,
				totalCount: imageFiles.length,
			});
		} catch (error) {
			const error_ = error as AxiosError;
			if (error_.code === "invalid_api_key") {
				store.set(CAPTION_RUNNING, false);
				throw error;
			}
		}
	}

	store.set(CAPTION_RUNNING, false);

	return "done";
}
