import path from "node:path";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import { env } from "@xenova/transformers";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

jest.mock("electron", () => ({
	app: {
		getPath: jest.fn().mockImplementation((key: string) => {
			switch (key) {
				case "userData": {
					return process.cwd();
				}

				default: {
					return "/default/path";
				}
			}
		}),
	},
}));

const originalImplementation = Array.isArray;
// @ts-expect-error we just want to mock this
Array.isArray = jest.fn(type => {
	if (
		type &&
		type.constructor &&
		(type.constructor.name === "Float32Array" || type.constructor.name === "BigInt64Array")
	) {
		return true;
	}

	return originalImplementation(type);
});

import { CustomHuggingFaceTransformersEmbeddings } from "@/langchain/custom-hugging-face-transformers-embeddings";
import { VectorStore } from "@/services/vector-store";

describe("VectorStore Integration Tests", () => {
	let vectorStore: VectorStore;
	const collectionName = "test_collection";
	const collectionName2 = "test_collection_2";
	const document1 = {
		content: "Live Painting is very nice",
		payload: {
			id: "live-painting:schema",
			label: "Live Painting",
			language: "en",
		},
	};

	const document2 = {
		id: "2998fdbf-f366-438f-a8e1-4e3cd0663a67",
		content: "Story Creator writes any story",
		payload: {
			id: "story-creator:schema",
			label: "Story Creator",
			language: "en",
		},
	};

	beforeAll(async () => {
		env.localModelPath = path.join(process.cwd(), "models");

		const embedding = new CustomHuggingFaceTransformersEmbeddings({
			modelName: "Xenova/all-MiniLM-L6-v2",
			maxTokens: 128,
			stripNewLines: true,
		});

		vectorStore = await VectorStore.init(embedding);

		await vectorStore.deleteCollection(collectionName);
		await vectorStore.deleteCollection(collectionName2);
	});

	afterAll(async () => {
		await vectorStore.stop();
	});

	it("should find nothing", async () => {
		const searchResults = await vectorStore.search(collectionName, document1.content);

		expect(searchResults!.length).toBe(0);
	}, 10_000);

	it("should verify Qdrant is running", async () => {
		const response = await axios.get("http://127.0.0.1:6333");

		expect(response.status).toBe(200);
		expect(response.data).toBeDefined();
		expect(response.data.title).toContain("qdrant");
	});

	it("should upsert two documents", async () => {
		const operations = await vectorStore.upsert(collectionName, [document1, document2]);

		expect(operations.length).toBe(2);
		expect(operations[0]!.status).toBe("completed");
		expect(operations[1]!.status).toBe("completed");

		const searchResults = await vectorStore.search(collectionName, document1.content);

		expect(searchResults).toBeDefined();
	}, 10_000);

	it("should upsert the same two documents, not create new ones", async () => {
		const operations = await vectorStore.upsert(collectionName, [document1, document2]);

		expect(operations.length).toBe(2);
		expect(operations[0]!.status).toBe("completed");
		expect(operations[1]!.status).toBe("completed");

		const searchResults = await vectorStore.search(collectionName, document1.content);

		expect(searchResults).toBeDefined();
		expect(searchResults!.length).toBe(2);

		expect(searchResults![1].id).toBe(document2.id);
	}, 10_000);

	it("should find only a document that is very similar", async () => {
		const searchResults = await vectorStore.search(collectionName, document1.content, {
			score_threshold: 0.75,
		});

		expect(searchResults!.length).toBe(1);
		expect(searchResults![0].payload).toMatchObject(document1.payload);
	}, 10_000);

	it("should throw an error as searching in a non-existing collection doesn't work", async () => {
		try {
			await vectorStore.search(collectionName2, document1.content);
		} catch (error) {
			expect(error).toBeDefined();
			console.log(error);
			expect((error as Error).message).toContain(
				`Collection ${collectionName2} doesn't exist`
			);
		}
	}, 10_000);

	it("should find the app that can write a story", async () => {
		const searchResults = await vectorStore.search(collectionName, "I want to write a story", {
			score_threshold: 0.45,
		});

		expect(searchResults!.length).toBe(1);
		expect(searchResults![0].payload).toMatchObject(document2.payload);
	}, 10_000);

	it("should paginate through documents with the scroll method", async () => {
		// Assuming the collection is already populated with documents

		// Initial scroll to start the pagination process
		const initialScrollResults = await vectorStore.scroll(collectionName, { limit: 1 });
		expect(initialScrollResults.points).toBeDefined();
		expect(initialScrollResults.points).toHaveLength(1);
		// Validate structure of a point
		expect(initialScrollResults.points[0].id).toBeDefined();
		expect(initialScrollResults.points[0].payload).toBeDefined();

		// Check for the presence of next_page_offset for pagination
		expect(initialScrollResults.next_page_offset).toBeDefined();

		// Use next_page_offset for the next scroll operation
		const nextScrollResults = await vectorStore.scroll(collectionName, {
			limit: 1,
			offset: initialScrollResults.next_page_offset,
		});

		expect(nextScrollResults.points).toBeDefined();
		expect(nextScrollResults.points).toHaveLength(1);
		// Ensure the document in the second scroll is not the same as in the first scroll
		expect(nextScrollResults.points[0].id).not.toEqual(initialScrollResults.points[0].id);
	}, 10_000);
});
