import { readFile } from "node:fs/promises";
import path from "path";

import { BrowserWindow } from "electron";
import _ from "lodash";
import sharp from "sharp";

import { MINIFIED_IMAGE_SIZE } from "../helpers/constants";
import { python } from "../helpers/python";
import { getDirectory, getUserData } from "../helpers/utils";

export interface CaptionOptions {
	batchSize?: number;
	parallel?: boolean;
}

export function toBase64Url(base64String: string) {
	return `data:image/jpeg;base64,${base64String}`;
}

export async function prepareFileBatches(filePaths: string[], { batchSize = 4 }: CaptionOptions) {
	const batches = _.chunk(filePaths, batchSize);
	return Promise.all(
		batches.map(batch =>
			Promise.all(
				batch.map(async filePath => {
					const fileContent = await readFile(filePath, "base64");
					return {
						filePath,
						base64: toBase64Url(fileContent.slice(1, 10)),
					};
				})
			)
		)
	);
}

export function gpt(
	batch: { base64: string; filePath: string }[],
	options: { instructions: string }
): Promise<{ filePath: string; caption: string }[]> {
	return new Promise(resolve => {
		setTimeout(
			() => {
				resolve(
					batch.map(() => ({
						caption: "a red apple",
						filePath: "foo.bar",
					}))
				);
			},
			Math.random() * 3000 + 3000
		);
	});
}

export async function wd14(
	batch: { base64: string; filePath: string }[],
	options: { model: string; exclude: string[] }
) {
	const window_ = BrowserWindow.getFocusedWindow();
	if (!window_) {
		return [];
	}

	const images = batch.map(entry => entry.filePath);
	const pathToPythonScript = getDirectory("python/caption/wd14/main.py");
	const wd14Path = getUserData("Captain_Data/downloads/caption/wd14");

	const modelPath = path.join(wd14Path, options.model);
	const tagsPath = path.join(
		wd14Path,
		options.model.replace(/model\.onnx$/, "selected_tags.csv")
	);

	try {
		let result: { filePath: string; caption: string }[] = [];
		await python(
			[
				pathToPythonScript,
				"--remove_underscore",
				"--image_paths",
				...images,
				"--model_path",
				modelPath,
				"--tags_path",
				tagsPath,
			],
			{
				stdout(data: string) {
					let parsed;
					try {
						parsed = JSON.parse(data).map((entry: any) => ({
							...entry,
							caption: entry.tags
								.filter(
									(tag: string) =>
										!options.exclude.includes(tag) && tag !== "general"
								)
								.join(", "),
						}));
					} finally {
						if (Array.isArray(parsed)) {
							result = parsed;
						}
					}
				},
			}
		);

		return result;
	} catch (error) {
		console.error(error);
		throw new Error("Failed to run WD14 script.");
	}
}

export async function handleFiles<T>(
	filePaths: string[],
	{
		batchSize,
		parallel,
		handler,
		onProgress,
		onDone,
		options,
	}: CaptionOptions & {
		onProgress?(result: {
			counter: number;
			totalCount: number;
			done: boolean;
			descriptions: { filePath: string; caption: string }[];
		}): void;
		onDone?(): void;
		handler(
			batch: { base64: string; filePath: string }[],
			options: T
		): Promise<{ filePath: string; caption: string }[]>;
		options: T;
	}
) {
	const batches = await prepareFileBatches(filePaths, { batchSize });

	let counter = 0;
	let done = false;
	const totalCount = filePaths.length;
	for (const batch of batches) {
		const runner = handler(batch, options).then(descriptions => {
			counter += batch.length;
			done = counter >= totalCount;
			console.log({ counter, totalCount, done });
			if (onProgress) {
				onProgress({ counter, totalCount, done, descriptions });
			}

			if (done && onDone) {
				onDone();
			}
		});
		if (!parallel) {
			await runner;
		}
	}
}

export async function createImageCache(
	filePath: string,
	cachePath: string,
	{
		width = MINIFIED_IMAGE_SIZE,
		height = MINIFIED_IMAGE_SIZE,
		type = "jpg",
		quality,
	}: { height?: number; width?: number; quality?: number; type?: "jpg" | "png" } = {}
): Promise<{
	filePath: string;
	cachePath: string;
	success: boolean;
	error: null | Error;
}> {
	let success = false;
	let error: null | Error = null;

	try {
		// Load the image to get its dimensions
		const metadata = await sharp(filePath).metadata();

		const originalWidth = metadata.width;
		const originalHeight = metadata.height;

		if (!originalWidth || !originalHeight) {
			error = new Error("Unable to retrieve image dimensions.");
			console.log(error.message);
			return { filePath, cachePath, success, error };
		}

		// Calculate the scaling factor to fit the image within the maximum area, maintaining aspect ratio
		const maxArea = width * height; // Maximum area (height * width)
		const originalArea = originalWidth * originalHeight;
		let scaleFactor = Math.sqrt(maxArea / originalArea);

		// Calculate new dimensions based on the scaling factor
		let newWidth = Math.floor(originalWidth * scaleFactor);
		let newHeight = Math.floor(originalHeight * scaleFactor);

		// Ensure new dimensions do not exceed max dimensions
		if (newWidth > width || newHeight > height) {
			scaleFactor = newWidth > newHeight ? width / originalWidth : height / originalHeight;
			newWidth = Math.floor(originalWidth * scaleFactor);
			newHeight = Math.floor(originalHeight * scaleFactor);
		}

		// Use sharp to resize the image to the new dimensions
		const image = sharp(filePath).resize(newWidth, newHeight, {
			fit: sharp.fit.fill, // Use 'fill' to ensure the exact dimensions are used
			withoutEnlargement: true,
		});

		// Save the resized image according to the specified type and quality
		switch (type) {
			case "png": {
				await image.png({ quality }).toFile(cachePath);
				break;
			}

			case "jpg": {
				await image.jpeg({ quality }).toFile(cachePath);
				break;
			}

			default: {
				await image.toFile(cachePath);
				break;
			}
		}

		success = true;
	} catch (error_) {
		if (error_ instanceof Error) {
			error = error_;
			console.error(error_.message);
		}
	}

	return { filePath, cachePath, success, error };
}
