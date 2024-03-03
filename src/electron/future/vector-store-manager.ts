import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { HNSWLib } from "langchain/vectorstores/hnswlib";

export class VectorStoreManager {
	private static instance: HNSWLib | null = null;
	private static apiKey: string | null = null;

	public static async getInstance(apiKey: string): Promise<HNSWLib> {
		if (!VectorStoreManager.instance) {
			if (!apiKey) {
				throw new Error("API Key is required to initialize the vector store.");
			}

			VectorStoreManager.apiKey = apiKey;

			const embedding = new OpenAIEmbeddings({ openAIApiKey: apiKey });
			VectorStoreManager.instance = new HNSWLib(embedding, { space: "captain" });
		}

		return VectorStoreManager.instance;
	}
}
