import { OpenAIEmbeddings } from "@langchain/openai";
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

import { VectorStore } from "@/services/vector-store";

describe("VectorStore Integration Tests", () => {
	let vectorStore: VectorStore;
	const collectionName = "test_collection";
	const document1 = {
		content: "Live Painting is very nice",
		payload: {
			id: "live-painting:schema",
			language: "en",
		},
	};

	const document2 = {
		id: "2998fdbf-f366-438f-a8e1-4e3cd0663a67",
		content: "Story Creator writes any story",
		payload: {
			id: "story-creator:schema",
			language: "en",
		},
	};

	beforeAll(async () => {
		const embedding = new OpenAIEmbeddings({
			openAIApiKey: process.env.OPENAI_API_KEY,
			modelName: "text-embedding-3-large",
		});

		vectorStore = await VectorStore.init(embedding);
	});

	afterAll(async () => {
		await vectorStore.deleteCollection(collectionName);
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
			await vectorStore.search("doesnt-exist", document1.content);
		} catch (error) {
			expect(error).toBeDefined();
			expect((error as Error).message).toContain("Collection doesnt-exist doesn't exist");
		}
	}, 10_000);

	it("should find the app that can write a story", async () => {
		const searchResults = await vectorStore.search(collectionName, "I want to write a story", {
			score_threshold: 0.45,
		});

		expect(searchResults!.length).toBe(1);
		expect(searchResults![0].payload).toMatchObject(document2.payload);
	}, 10_000);
});
