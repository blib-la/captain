import fsp from "node:fs/promises";

// The @xenova/transformers package is imported directly from GitHub as it includes
// certain functionalities that are not available in the npm published version. This package
// may not have complete type definitions, which can cause TypeScript to raise compilation errors.
// The use of `@ts-ignore` is necessary here to bypass these TypeScript errors.
// However, this is a known issue and has been accounted for in our usage of the library.
// See package.json for the specific version and source of the @xenova/transformers package.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { env } from "@xenova/transformers";
import { globby } from "globby";
import matter from "gray-matter";

import { PORTS } from "@/electron/constants";
import { CustomHuggingFaceTransformersEmbeddings } from "@/electron/langchain/custom-hugging-face-transformers-embeddings";
import { VectorStore } from "@/electron/services/vector-store";
import { getCaptainData, getCaptainDownloads, getDirectory } from "@/electron/utils/path-helpers";
import { VECTOR_STORE_COLLECTION } from "@/shared/constants";

export async function initialize() {
	env.localModelPath = getCaptainDownloads("llm/embeddings");
	env.allowRemoteModels = false;
	env.allowLocalModels = true;

	await VectorStore.init({
		port: PORTS.VECTOR_STORE,
		embeddings: new CustomHuggingFaceTransformersEmbeddings({
			modelName: "Xenova/all-MiniLM-L6-v2",
			maxTokens: 128,
			stripNewLines: true,
		}),
	});
}

/**
 * Delete all documents from the VECTOR_STORE_COLLECTION collection.
 */
export async function reset() {
	try {
		await VectorStore.getInstance.deleteCollection(VECTOR_STORE_COLLECTION);
	} catch {}
}

export async function populateFromDocuments() {
	const corePaths = await globby(["**/*.md"], {
		cwd: getDirectory("actions"),
		absolute: true,
	});

	const appPaths = await globby(["**/captain.md"], {
		cwd: getCaptainData("apps"),
		absolute: true,
	});

	const documents = await Promise.all(
		[...corePaths, ...appPaths].map(async documentPath => {
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
					content,
				},
			};
		})
	);
	const vectorStore = VectorStore.getInstance;

	return vectorStore.upsert(VECTOR_STORE_COLLECTION, [...documents]);
}
