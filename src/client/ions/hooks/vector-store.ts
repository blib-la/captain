import { useEffect, useState } from "react";
import { useDebounce } from "use-debounce";

import { buildKey } from "#/build-key";
import { ID } from "#/enums";
import type {
	SearchOptions,
	ScrollOptions,
	VectorStoreResponse,
	VectorStoreDocument,
} from "#/types/vector-store";
import { useObject } from "@/ions/hooks/object";

/**
 * Custom React hook to interact with the vector store, providing search functionality.
 *
 * This hook manages a search query against a vector store, debouncing the input value to avoid
 * excessive querying. It sends the debounced query to the vector store and manages the state of
 * the search results, providing real-time feedback as the user types.
 *
 * @param {string} query The initial search query string.
 * @param {SearchOptions} [{ score_threshold }={}] The search options including score threshold to filter the results.
 * @returns {VectorStoreResponse[]} The search results as an array of VectorStoreResponse objects.
 *
 * @example
 * // In a React component
 * const searchResults = useVectorStore('search term', { score_threshold: 0.5 });
 * // searchResults will contain an array of search responses where each item has a score above 0.5
 */
export function useVectorStore(query: string, { score_threshold, filter }: SearchOptions = {}) {
	const [query_] = useDebounce(query, 300);
	const [results, setResults] = useState<VectorStoreResponse[]>([]); // State to store the search results
	const filter_ = useObject(filter, 100);

	useEffect(() => {
		if (query_?.trim()) {
			// Only proceed with a non-empty query
			window.ipc.send(buildKey([ID.VECTOR_STORE], { suffix: ":search" }), {
				query: query_,
				options: { score_threshold, filter: filter_ },
			});
		} else {
			setResults([]);
		}
	}, [query_, score_threshold, filter_]);

	useEffect(() => {
		const unsubscribeResult = window.ipc.on(
			buildKey([ID.VECTOR_STORE], { suffix: ":result" }),
			data => {
				console.log("Search result received:", data);
				setResults(data);
			}
		);
		const unsubscribeError = window.ipc.on(
			buildKey([ID.VECTOR_STORE], { suffix: ":error" }),
			error => {
				console.error("Search error:", error);
			}
		);

		return () => {
			unsubscribeResult();
			unsubscribeError();
		};
	}, []);

	return results;
}

export function useVectorScroll({ order_by, with_payload, filter }: ScrollOptions = {}) {
	const [results, setResults] = useState<VectorStoreResponse[]>([]); // State to store the search results
	const filter_ = useObject(filter, 100);

	useEffect(() => {
		// Only proceed with a non-empty query
		window.ipc.send(buildKey([ID.VECTOR_STORE], { suffix: ":scroll" }), {
			options: { order_by, with_payload, filter: filter_ },
		});
	}, [order_by, with_payload, filter_]);

	useEffect(() => {
		const unsubscribeResult = window.ipc.on(
			buildKey([ID.VECTOR_STORE], { suffix: ":scrollResult" }),
			data => {
				console.log("Search result received:", data);
				setResults(data);
			}
		);
		const unsubscribeError = window.ipc.on(
			buildKey([ID.VECTOR_STORE], { suffix: ":error" }),
			error => {
				console.error("Search error:", error);
			}
		);

		return () => {
			unsubscribeResult();
			unsubscribeError();
		};
	}, []);

	return results;
}

export function vectorUpsert(documents: VectorStoreDocument[]) {
	window.ipc.send(buildKey([ID.VECTOR_STORE], { suffix: ":upsert" }), documents);
}
