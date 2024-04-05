import {
	ERROR_KEY,
	VECTOR_STORE_SCROLL_KEY,
	VECTOR_STORE_SCROLL_RESULT_KEY,
	VECTOR_STORE_SEARCH_KEY,
	VECTOR_STORE_SEARCH_RESULT_KEY,
} from "@captn/utils/constants";
import { ipcMain } from "electron";

import { VECTOR_STORE_COLLECTION } from "#/constants";
import type { ScrollOptions, SearchOptions } from "#/types/vector-store";
import { VectorStore } from "@/services/vector-store";

ipcMain.on(
	VECTOR_STORE_SEARCH_KEY,
	async (event, { query, options }: { query: string; options?: SearchOptions }) => {
		try {
			const vectorStore = VectorStore.getInstance;

			const result = await vectorStore.search(VECTOR_STORE_COLLECTION, query, options);

			event.sender.send(VECTOR_STORE_SEARCH_RESULT_KEY, result);
		} catch (error) {
			console.log(error);
			event.sender.send(ERROR_KEY, error);
		}
	}
);

ipcMain.on(VECTOR_STORE_SCROLL_KEY, async (event, { options }: { options?: ScrollOptions }) => {
	try {
		const vectorStore = VectorStore.getInstance;

		const { points } = await vectorStore.scroll(VECTOR_STORE_COLLECTION, options);
		event.sender.send(VECTOR_STORE_SCROLL_RESULT_KEY, points);
	} catch (error) {
		event.sender.send(ERROR_KEY, error);
	}
});
