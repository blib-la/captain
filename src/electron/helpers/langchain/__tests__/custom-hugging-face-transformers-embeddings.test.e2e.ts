import path from "node:path";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { env } from "@xenova/transformers";

import { CustomHuggingFaceTransformersEmbeddings } from "../custom-hugging-face-transformers-embeddings";

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

describe("CustomHuggingFaceEmbeddings", () => {
	let embeddings: CustomHuggingFaceTransformersEmbeddings;

	beforeAll(() => {
		env.localModelPath = path.join(process.cwd(), "models");

		embeddings = new CustomHuggingFaceTransformersEmbeddings({
			modelName: "Xenova/all-MiniLM-L6-v2",
			maxTokens: 128,
			stripNewLines: true,
		});
	});

	it("should create embeddings for a given text", async () => {
		const text = "Hello, world!";
		const result = await embeddings.embedQuery(text);

		expect(Array.isArray(result)).toBeTruthy();
		expect(result.length).toBeGreaterThan(0);
	});

	it("should create embeddings for multiple documents", async () => {
		const texts = ["Hello, world!", "Goodbye, world!"];
		const results = await embeddings.embedDocuments(texts);

		// Check that results is an array of arrays
		expect(Array.isArray(results)).toBeTruthy();
		expect(results.length).toEqual(texts.length);

		// Check each result to ensure it's an array and not empty
		for (const [, embedding] of results.entries()) {
			expect(Array.isArray(embedding)).toBeTruthy();
			expect(embedding.length).toBeGreaterThan(0);
		}
	});

	describe("without maxTokens defined", () => {
		let defaultEmbeddings: CustomHuggingFaceTransformersEmbeddings;

		beforeAll(() => {
			defaultEmbeddings = new CustomHuggingFaceTransformersEmbeddings({
				modelName: "Xenova/all-MiniLM-L6-v2",
				stripNewLines: true,
			});
		});

		it("should create embeddings for a given text using default settings", async () => {
			const text = "Hello, world!";
			const result = await defaultEmbeddings.embedQuery(text);

			expect(Array.isArray(result)).toBeTruthy();
			expect(result.length).toBeGreaterThan(0);
		});

		it("should create embeddings for multiple documents using default settings", async () => {
			const texts = ["Hello, world!", "Goodbye, world!"];
			const results = await defaultEmbeddings.embedDocuments(texts);

			expect(Array.isArray(results)).toBeTruthy();
			expect(results.length).toEqual(texts.length);

			for (const [, embedding] of results.entries()) {
				expect(Array.isArray(embedding)).toBeTruthy();
				expect(embedding.length).toBeGreaterThan(0);
			}
		});
	});
});
