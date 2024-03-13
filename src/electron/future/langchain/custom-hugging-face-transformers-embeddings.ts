import type { HuggingFaceTransformersEmbeddingsParams } from "@langchain/community/embeddings/hf_transformers";
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/hf_transformers";
// The @xenova/transformers package is imported directly from GitHub as it includes
// certain functionalities that are not available in the npm published version. This package
// may not have complete type definitions, which can cause TypeScript to raise compilation errors.
// The use of `@ts-ignore` is necessary here to bypass these TypeScript errors.
// However, this is a known issue and has been accounted for in our usage of the library.
// See package.json for the specific version and source of the @xenova/transformers package.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { AutoTokenizer, env } from "@xenova/transformers";

// Configuration for Transformers.js to only use local models
env.allowRemoteModels = false;
env.allowLocalModels = true;

/**
 * Truncate texts to a specified maximum token length.
 *
 * @param texts - The array of text strings to truncate.
 * @param modelName - The name of the model used for tokenization.
 * @param maxTokens - The maximum number of tokens allowed for each text.
 * @returns A Promise that resolves to an array of truncated text strings.
 */
async function truncateTexts(
	texts: string[],
	modelName: string,
	maxTokens: number
): Promise<string[]> {
	const tokenizer = await AutoTokenizer.from_pretrained(modelName);
	return Promise.all(
		texts.map(async text => {
			const { input_ids } = await tokenizer(text, {
				truncation: true,
				max_length: maxTokens,
			});
			return tokenizer.decode(input_ids, { skip_special_tokens: true });
		})
	);
}

/**
 * Custom wrapper around HuggingFaceTransformersEmbeddings to support text truncation
 * to a specified maximum number of tokens before embedding. This can be useful
 * when working with models that have a fixed maximum input size, but produce better results
 * when you use a lower input size as the maximum.
 *
 * @extends HuggingFaceTransformersEmbeddings
 */
export class CustomHuggingFaceTransformersEmbeddings extends HuggingFaceTransformersEmbeddings {
	private maxTokens?: number;

	constructor(
		fields?: Partial<HuggingFaceTransformersEmbeddingsParams> & {
			maxTokens?: number;
		}
	) {
		super(fields);
		this.maxTokens = fields?.maxTokens;
	}

	/**
	 * Embeds multiple documents, optionally truncating each to a maximum token length.
	 *
	 * @param texts - The array of text strings to embed.
	 * @returns A Promise that resolves to a two-dimensional array of embeddings, with each
	 * sub-array representing the embedding of one input text.
	 */
	async embedDocuments(texts: string[]): Promise<number[][]> {
		// Truncate texts if maxTokens is specified
		if (this.maxTokens) {
			const truncatedTexts = await truncateTexts(texts, this.modelName, this.maxTokens);
			return super.embedDocuments(truncatedTexts);
		}

		return super.embedDocuments(texts);
	}

	/**
	 * Embeds a single query, optionally truncating it to a maximum token length.
	 *
	 * @param text - The text string to embed.
	 * @returns A Promise that resolves to an array representing the embedding of the input text.
	 */
	async embedQuery(text: string): Promise<number[]> {
		// Truncate text if maxTokens is specified
		if (this.maxTokens) {
			const [truncatedText] = await truncateTexts([text], this.modelName, this.maxTokens);
			return super.embedQuery(truncatedText);
		}

		return super.embedQuery(text);
	}
}
