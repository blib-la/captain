import fsp from "node:fs/promises";
import path from "node:path";

import type { ComfyUIFileMetaData } from "@captn/utils";
import { execa } from "execa";
import { v4 } from "uuid";

import { logError, logger } from "@/electron/services/logger";
import { VectorStore } from "@/electron/services/vector-store";
import { createDirectory } from "@/electron/utils/fs";
import { getCaptainData, getDirectory, getPythonEmbedded } from "@/electron/utils/path-helpers";
import { VECTOR_STORE_COLLECTION } from "@/shared/constants";
import { cleanPath } from "@/shared/string";

export async function writePngMetaData(filePath: string, metadata: ComfyUIFileMetaData) {
	const pythonBinaryPath = getPythonEmbedded("python.exe");
	const scriptPath = getDirectory("python/png/main.py");
	const scriptArguments = ["--image_path", filePath];

	if (metadata.positivePrompt) {
		scriptArguments.push("--positive_prompt", metadata.positivePrompt);
	}

	if (metadata.caption) {
		scriptArguments.push("--caption", metadata.caption);
	}

	if (metadata.description) {
		scriptArguments.push("--description", metadata.description);
	}

	if (metadata.negativePrompt) {
		scriptArguments.push("--negative_prompt", metadata.negativePrompt);
	}

	if (metadata.tags) {
		scriptArguments.push("--tags", metadata.tags);
	}

	if (metadata.prompt) {
		scriptArguments.push("--prompt", metadata.prompt);
	}

	return execa(pythonBinaryPath, ["-u", scriptPath, ...scriptArguments]);
}

export async function copyWithMetaData({
	source,
	destination,
	metadata,
}: {
	source: string;
	destination: string;
	metadata?: ComfyUIFileMetaData;
}) {
	const filePath = getCaptainData("files", cleanPath(destination));
	const { dir: directory, ext } = path.parse(filePath);

	try {
		createDirectory(directory);
		// Copy the file
		await fsp.copyFile(source, filePath);
	} catch (error) {
		logError(error, "createDirectory:copy-image-with-metadata");
	}

	logger.info(`copy image from ${source} to ${filePath}`);
	const id = v4();

	const fileName = `${id}${ext}`;
	const destinationPath = path.join(directory, fileName);
	await fsp.rename(filePath, destinationPath);
	logger.info(`renamed image from ${filePath} to ${destinationPath}`);
	if (metadata?.positivePrompt) {
		logger.info(
			`add metadata to image at ${destinationPath} with positivePrompt: ${metadata.positivePrompt}`
		);
		try {
			await writePngMetaData(destinationPath, metadata);
		} catch (error) {
			logError(error, "writePngMetaData:copy-image-with-metadata");
		}

		try {
			const vectorStore = VectorStore.getInstance;
			await vectorStore.upsert(VECTOR_STORE_COLLECTION, [
				{
					content: metadata.positivePrompt,
					payload: {
						id: v4(),
						label: fileName,
						type: "image",
						fileType: ext.replace(".", ""),
						language: "en",
						filePath: destinationPath,
						content: metadata.positivePrompt,
					},
				},
			]);
			return destinationPath;
		} catch (error) {
			logError(error, "vectorStore.upsert:copy-image-with-metadata");
		}
	}
}
