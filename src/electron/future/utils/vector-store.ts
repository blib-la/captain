import fsp from "node:fs/promises";
import path from "node:path";

import type { VectorStoreDocument } from "@captn/utils/types";
// The @xenova/transformers package is imported directly from GitHub as it includes
// certain functionalities that are not available in the npm published version. This package
// may not have complete type definitions, which can cause TypeScript to raise compilation errors.
// The use of `@ts-ignore` is necessary here to bypass these TypeScript errors.
// However, this is a known issue and has been accounted for in our usage of the library.
// See package.json for the specific version and source of the @xenova/transformers package.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { env } from "@xenova/transformers";
import exifr from "exifr";
import { globby } from "globby";
import matter from "gray-matter";

import { VECTOR_STORE_COLLECTION } from "#/constants";
import { extractH1Headings } from "#/string";
import { CustomHuggingFaceTransformersEmbeddings } from "@/langchain/custom-hugging-face-transformers-embeddings";
import { VectorStore } from "@/services/vector-store";
import {
	getCaptainData,
	getCaptainDownloads,
	getDirectory,
	normalizePath,
} from "@/utils/path-helpers";
import { splitDocument } from "@/utils/split-documents";

export async function initialize() {
	env.localModelPath = getCaptainDownloads("llm/embeddings");
	env.allowRemoteModels = false;
	env.allowLocalModels = true;

	await VectorStore.init(
		new CustomHuggingFaceTransformersEmbeddings({
			modelName: "Xenova/all-MiniLM-L6-v2",
			maxTokens: 128,
			stripNewLines: true,
		})
	);
}

export async function reset() {
	try {
		await VectorStore.getInstance.deleteCollection(VECTOR_STORE_COLLECTION);
	} catch {}
}

export async function populateFromDocuments() {
	const imagePaths = await globby(["**/*.png"], {
		cwd: getCaptainData("files/images"),
		absolute: true,
	});
	const storyPaths = await globby(["**/*.md"], {
		cwd: getCaptainData("files/stories"),
		absolute: true,
	});
	const documentPaths = await globby(["**/captain.md"], {
		cwd: getCaptainData("apps"),
		absolute: true,
	});

	const corePaths = await globby(["**/*.md"], {
		cwd: getDirectory("actions"),
		absolute: true,
	});

	const images = await Promise.all(
		imagePaths.map(async imagePath => {
			const { name, base } = path.parse(imagePath);
			const data = {
				content: "an image",
				payload: {
					id: name,
					type: "image",
					fileType: "png",
					language: "en",
					label: base,
					filePath: imagePath,
				},
			};

			// Try to read the data from the image
			try {
				const exif = await exifr.parse(imagePath);
				data.content = exif.Caption || exif.Prompt || exif.Description || data.content;
			} catch {
				console.log("No image data found");
			}

			return data;
		})
	);
	const stories_: VectorStoreDocument[] = [];
	for (const storyPath of storyPaths) {
		const content = await fsp.readFile(storyPath, "utf8");
		const { dir } = path.parse(storyPath);
		const chunks = await splitDocument("md", content, { chunkSize: 200, chunkOverlap: 10 });
		for (const chunk of chunks) {
			stories_.push({
				content: chunk,
				payload: {
					id: normalizePath(dir).split("/").pop()!,
					label: extractH1Headings(content)[0] || "Story",
					type: "story",
					fileType: "md",
					language: "en",
					filePath: storyPath,
				},
			});
		}
	}

	const stories = await Promise.all(stories_);

	const documents = await Promise.all(
		[...documentPaths, ...corePaths].map(async documentPath => {
			const markdownWithFrontmatter = await fsp.readFile(documentPath, "utf8");
			const { content, data } = matter(markdownWithFrontmatter);
			return {
				content,
				payload: {
					id: data.id,
					type: data.type,
					language: data.language,
					action: data.action,
					label: data.label,
					description: data.description,
					parameters: data.parameters,
					function: data.function,
					icon: data.icon,
					iconColor: data.iconColor,
				},
			};
		})
	);
	const vectorStore = VectorStore.getInstance;

	return vectorStore.upsert(VECTOR_STORE_COLLECTION, [...documents, ...images, ...stories]);
}
