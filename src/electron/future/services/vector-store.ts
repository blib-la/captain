import fsp from "node:fs/promises";

import type { ScrollOptions, SearchOptions, VectorStoreDocument } from "@captn/utils/types";
import type { EmbeddingsInterface } from "@langchain/core/embeddings";
import type { Schemas as QdrantSchemas } from "@qdrant/js-client-rest";
import { QdrantClient } from "@qdrant/js-client-rest";
import axios from "axios";
import type { ExecaChildProcess } from "execa";
import { execa } from "execa";
import { v4 } from "uuid";

import logger from "@/services/logger";
import { getCaptainData } from "@/utils/path-helpers";

interface ServiceReadyConfig {
	maxRetries?: number;
	retryInterval?: number;
	timeout?: number;
}

export class VectorStore {
	private static instance: VectorStore | null = null;
	private client: QdrantClient | null = null;
	private process: ExecaChildProcess<string> | undefined;
	private embeddings: EmbeddingsInterface;
	private url: string;

	private constructor(embeddings: EmbeddingsInterface) {
		this.embeddings = embeddings;
		this.url = "http://127.0.0.1:6333";
	}

	/**
	 * Initializes the VectorStore singleton instance with the specified embeddings model.
	 * This method starts the Qdrant service and initializes the Qdrant client.
	 *
	 * @param {EmbeddingsInterface} embeddings - The embeddings model to be used for document vectorization.
	 * @returns {Promise<VectorStore>} The initialized VectorStore singleton instance.
	 */
	public static async init(embeddings: EmbeddingsInterface): Promise<VectorStore> {
		if (!VectorStore.instance) {
			VectorStore.instance = new VectorStore(embeddings);
			await VectorStore.instance.start();
			await VectorStore.instance.initializeClient();
		}

		return VectorStore.instance;
	}

	/**
	 * Starts the Qdrant service by executing the Qdrant binary if the binary exists.
	 * It waits for the Qdrant service to become ready before proceeding, ensuring that
	 * the service is fully operational for subsequent operations.
	 *
	 * @throws {Error} If the Qdrant binary is not found at the specified path.
	 * @throws {Error} If Qdrant can't be started.
	 */
	private async start() {
		if (!this.process) {
			const cwdPath = getCaptainData("qdrant");
			const binaryPath = getCaptainData("qdrant/qdrant.exe");
			const configPath = getCaptainData("qdrant/config.yaml");

			const scriptArguments = ["--config-path", configPath];

			// Check if the binary exists
			try {
				await fsp.access(binaryPath);
			} catch {
				throw new Error(`Qdrant binary not found at path: ${binaryPath}`);
			}

			// Start the process and wait until its ready
			try {
				this.process = execa(binaryPath, [...scriptArguments], { cwd: cwdPath });

				await this.serviceReady();
			} catch (error) {
				throw new Error(`Qdrant can't be started: ${error}`);
			}
		}
	}

	/**
	 * Stops the Qdrant service if it is running.
	 */
	public async stop() {
		if (this.process) {
			this.process.kill();
			this.process = undefined;
		}
	}

	/**
	 * Initializes the Qdrant client for communicating with the Qdrant service.
	 */
	private initializeClient() {
		this.client ||= new QdrantClient({ url: this.url });
	}

	/**
	 * Waits for the Qdrant service to become fully operational by repeatedly checking its
	 * health endpoint.
	 *
	 * @param {ServiceReadyConfig} config - `maxRetries`, `retryInterval`, and `timeout`
	 * @throws {Error} If the Qdrant service does not become ready within the specified retries and interval.
	 */
	private async serviceReady(config: ServiceReadyConfig = {}) {
		const { maxRetries = 30, retryInterval = 1000, timeout = 5000 } = config;

		const healthEndpoint = `${this.url}`;

		for (let index = 0; index < maxRetries; index++) {
			try {
				const response = await axios.get(healthEndpoint, { timeout });

				if (response.status === 200) {
					logger.info("vector-store: Qdrant is ready");
					return;
				}
			} catch {}

			await new Promise(resolve => {
				setTimeout(resolve, retryInterval);
			});
		}

		throw new Error("Qdrant service did not become ready in time.");
	}

	/**
	 * Returns the current instance of the VectorStore class.
	 *
	 * @returns {VectorStore} The current VectorStore instance.
	 * @throws {Error} If the instance has not been initialized yet.
	 */
	public static get getInstance(): VectorStore {
		if (!VectorStore.instance) {
			throw new Error(
				"VectorStore instance has not been initialized. Please call 'init' first."
			);
		}

		return VectorStore.instance;
	}

	/**
	 * Inserts or updates documents in the specified collection. If a document ID is not provided,
	 * the method will attempt to find an existing document based on the payload 'id' and 'language'.
	 * If an existing document is not found, a new UUID will be generated.
	 *
	 * @example Auto-ID (recommended)
	 * ```javascript
	 * const document = {
	 *   content: "Live Painting is very nice",
	 *   payload: {
	 *     id: "live-painting:schema",
	 *     language: "en",
	 *   },
	 * };
	 * ```
	 *
	 * @example Custom-ID using uuid
	 * ```javascript
	 * const document = {
	 *   id: v4(),
	 *   content: "Live Painting is very nice",
	 *   payload: {
	 *     id: "live-painting:schema",
	 *     language: "en",
	 *   },
	 * };
	 * ```
	 *
	 * @param {string} collectionName - The name of the collection where documents will be upserted.
	 * @param {VectorStoreDocument[]} documents - An array of documents to be upserted.
	 * @returns {Promise<any[]>} A promise that resolves when all upsert operations are completed.
	 */
	public async upsert(collectionName: string, documents: VectorStoreDocument[]) {
		await this.ensureCollection(collectionName);

		const contentArray = documents.map(document_ => document_.content);
		const vectors = await this.embeddings.embedDocuments(contentArray);

		const operations = documents.map(async (document_, index) => {
			let documentId = document_.id;

			if (!documentId) {
				// Find an existing document by payload.id and payload.language
				const filter: QdrantSchemas["Filter"] = {
					must: [
						{ key: "id", match: { value: document_.payload.id } },
						{ key: "language", match: { value: document_.payload.language } },
					],
				};
				const result = await this.client?.scroll(collectionName, {
					filter,
					with_payload: true,
					with_vector: false,
				});

				// If a document exists, use its ID; otherwise, generate a new one
				documentId = result && result.points.length > 0 ? result.points[0].id : v4();
			}

			return this.client?.upsert(collectionName, {
				points: [
					{
						id: documentId,
						vector: vectors[index],
						payload: document_.payload,
					},
				],
				wait: true,
			});
		});

		// Execute all upsert operations and wait for them to complete
		return Promise.all(operations);
	}

	/**
	 * Searches for documents in the specified collection based on the given query.
	 * This method automatically ensures that the collection exists before performing the search.
	 *
	 * @param {string} collectionName - The name of the collection to search in.
	 * @param {string} query - The text query to search for similar documents.
	 * @param {SearchOptions} [options] - Optional search parameters.
	 * @returns {Promise<any>} A promise that resolves with the search results.
	 */
	public async search(collectionName: string, query: string, options?: SearchOptions) {
		await this.ensureCollection(collectionName);

		const queryVector = await this.embeddings.embedDocuments([query]);
		return this.client?.search(collectionName, {
			vector: queryVector[0],
			...options,
		});
	}

	/**
	 * Scrolls for documents in the specified collection based on the given query.
	 *
	 * @param {string} collectionName - The name of the collection to search in.
	 * @param {ScrollOptions} [options] - Optional scroll parameters.
	 * @returns {Promise<any>} A promise that resolves with the search results.
	 */
	public async scroll(collectionName: string, options?: ScrollOptions) {
		await this.ensureCollection(collectionName);

		return this.client!.scroll(collectionName, options);
	}

	/**
	 * Ensures the existence of the specified collection. If the collection does not exist,
	 * it can be automatically created with a default configuration based on the embeddings model.
	 *
	 * @param {string} collectionName - The name of the collection to ensure.
	 * @param {boolean} autoCreate - Whether to automatically create the collection if it does not exist.
	 * @returns {Promise<void>}
	 */
	private async ensureCollection(collectionName: string, autoCreate: boolean = true) {
		if (!this.client) {
			throw new Error("Qdrant client is not initialized.");
		}

		const { exists } = await this.client.collectionExists(collectionName);

		// Create the collection if it doesn't exist
		if (!exists && autoCreate) {
			const sampleEmbedding = await this.embeddings.embedDocuments(["test"]);
			const vectorSize = sampleEmbedding[0].length;

			const collectionConfig: QdrantSchemas["CreateCollection"] = {
				vectors: {
					size: vectorSize,
					distance: "Cosine",
				},
			};

			await this.client.createCollection(collectionName, collectionConfig);

			// Create the index for the internal id
			this.client.createPayloadIndex(collectionName, {
				field_name: "id",
				field_schema: "keyword",
			});
		}

		if (!exists && !autoCreate) {
			throw new Error(`Collection ${collectionName} doesn't exist`);
		}
	}

	/**
	 * Deletes the specified collection from the Qdrant database.
	 *
	 * @param {string} collectionName - The name of the collection to be deleted.
	 * @returns {Promise<any>} A promise that resolves when the collection has been deleted.
	 */
	public async deleteCollection(collectionName: string) {
		await this.ensureCollection(collectionName, false);

		return this.client?.deleteCollection(collectionName);
	}
}
