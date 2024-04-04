import { ipcMain } from "electron";

import { buildKey } from "#/build-key";
import { VECTOR_STORE_COLLECTION } from "#/constants";
import { ID } from "#/enums";
import type { ScrollOptions, SearchOptions, VectorStoreDocument } from "#/types/vector-store";
import { VectorStore } from "@/services/vector-store";

ipcMain.on(
	buildKey([ID.VECTOR_STORE], { suffix: ":save" }),
	async (event, documents: VectorStoreDocument[]) => {
		try {
			const vectorStore = VectorStore.getInstance;

			const operations = await vectorStore.upsert(VECTOR_STORE_COLLECTION, documents);

			event.sender.send(buildKey([ID.VECTOR_STORE], { suffix: ":saved" }), operations);
		} catch (error) {
			event.sender.send(buildKey([ID.VECTOR_STORE], { suffix: ":error" }), error);
		}
	}
);

ipcMain.on(
	buildKey([ID.VECTOR_STORE], { suffix: ":search" }),
	async (event, { query, options }: { query: string; options?: SearchOptions }) => {
		try {
			const vectorStore = VectorStore.getInstance;

			const result = await vectorStore.search(VECTOR_STORE_COLLECTION, query, options);

			event.sender.send(buildKey([ID.VECTOR_STORE], { suffix: ":result" }), result);
		} catch (error) {
			console.log(error);
			event.sender.send(buildKey([ID.VECTOR_STORE], { suffix: ":error" }), error);
		}
	}
);

ipcMain.on(
	buildKey([ID.VECTOR_STORE], { suffix: ":scroll" }),
	async (event, { options }: { options?: ScrollOptions }) => {
		try {
			const vectorStore = VectorStore.getInstance;

			const { points } = await vectorStore.scroll(VECTOR_STORE_COLLECTION, options);
			event.sender.send(buildKey([ID.VECTOR_STORE], { suffix: ":scrollResult" }), points);
		} catch (error) {
			event.sender.send(buildKey([ID.VECTOR_STORE], { suffix: ":error" }), error);
		}
	}
);
