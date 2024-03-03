import { BrowserWindow } from "electron";
import type { Document } from "langchain/document";

import { buildKey } from "#/build-key";
import { ID } from "#/enums";
import { keyStore } from "@/stores";
import { VectorStoreManager } from "@/vector-store-manager";

export type File = {
	path: string;
	data: string;
	metadata?: {
		path: string;
	};
};

export async function save(files: File[]): Promise<boolean> {
	const window_ = BrowserWindow.getFocusedWindow();
	if (!window_) {
		return false;
	}

	const apiKey = keyStore.get("openAiApiKey");
	if (!apiKey) {
		window_.webContents.send(
			buildKey([ID.VECTOR_STORE], { suffix: ":error" }),
			`Missing OpenAI API Key`
		);
		return false;
	}

	const documents: Document[] = files.map(file => ({
		pageContent: file.data,
		metadata: {
			path: file.path,
			...file.metadata,
		},
	}));

	const vectorStore = await VectorStoreManager.getInstance(apiKey);

	// Create a vector store using HNSWLib with the provided files
	await vectorStore.addDocuments(documents);

	return true;
}
