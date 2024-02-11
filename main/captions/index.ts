import { readFile } from "node:fs/promises";

import _ from "lodash";
import sharp from "sharp";

import { MINIFIED_IMAGE_SIZE } from "../helpers/constants";

export interface CaptionOptions {
	batchSize: number;
}

export function toBase64Url(base64String: string) {
	return `data:image/jpeg;base64,${base64String}`;
}

export async function prepareFileBatches(filePaths: string[], { batchSize }: CaptionOptions) {
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
): Promise<string[]> {
	return new Promise(resolve => {
		setTimeout(
			() => {
				resolve(batch.map(() => "a red apple"));
			},
			Math.random() * 3000 + 3000
		);
	});
}

export async function handleFiles<T>(
	filePaths: string[],
	{
		batchSize,
		handler,
		onProgress,
		onDone,
		options,
	}: CaptionOptions & {
		onProgress?(result: {
			counter: number;
			totalCount: number;
			done: boolean;
			descriptions: string[];
		}): void;
		onDone?(): void;
		handler(batch: { base64: string; filePath: string }[], options: T): Promise<string[]>;
		options: T;
	}
) {
	const batches = await prepareFileBatches(filePaths, { batchSize });

	let counter = 0;
	let done = false;
	const totalCount = filePaths.length;
	for (const batch of batches) {
		handler(batch, options).then(descriptions => {
			counter += batch.length;
			done = counter >= totalCount;
			if (onProgress) {
				onProgress({ counter, totalCount, done, descriptions });
			}

			if (done && onDone) {
				onDone();
			}
		});
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
