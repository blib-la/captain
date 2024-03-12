import type { HuggingFaceTransformersEmbeddingsParams } from "@langchain/community/embeddings/hf_transformers";
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/hf_transformers";
import { AutoTokenizer, env } from "@xenova/transformers";

// Configuration for Transformers.js to only use local models
env.allowRemoteModels = false;
env.allowLocalModels = true;

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

	async embedDocuments(texts: string[]): Promise<number[][]> {
		// Truncate texts if maxTokens is specified
		if (this.maxTokens) {
			const truncatedTexts = await truncateTexts(texts, this.modelName, this.maxTokens);
			return super.embedDocuments(truncatedTexts);
		}

		return super.embedDocuments(texts);
	}

	async embedQuery(text: string): Promise<number[]> {
		// Truncate text if maxTokens is specified
		if (this.maxTokens) {
			const [truncatedText] = await truncateTexts([text], this.modelName, this.maxTokens);
			return super.embedQuery(truncatedText);
		}

		return super.embedQuery(text);
	}
}
