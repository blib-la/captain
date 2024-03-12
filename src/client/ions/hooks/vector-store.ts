import { useEffect, useState } from "react";
import { useDebounce } from "use-debounce";

import { buildKey } from "#/build-key";
import { ID } from "#/enums";
import type { SearchOptions, VectorStoreResponse } from "#/types/vector-store";

/**
 * Custom React hook to interact with the vector store, providing search functionality.
 *
 * This hook manages a search query against a vector store, debouncing the input value to avoid
 * excessive querying. It sends the debounced query to the vector store and manages the state of
 * the search results, providing real-time feedback as the user types.
 *
 * @param {string} value The initial search query string.
 * @param {SearchOptions} [{ score_threshold }={}] The search options including score threshold to filter the results.
 * @returns {VectorStoreResponse[]} The search results as an array of VectorStoreResponse objects.
 *
 * @example
 * // In a React component
 * const searchResults = useVectorStore('search term', { score_threshold: 0.5 });
 * // searchResults will contain an array of search responses where each item has a score above 0.5
 */
export function useVectorStore(value: string, { score_threshold }: SearchOptions = {}) {
	const [query] = useDebounce(value, 300); // Debounce the search value to limit the search calls
	const [results, setResults] = useState<VectorStoreResponse[]>([]); // State to store the search results
	// Effect to handle the actual search querying when the debounced query or score_threshold changes
	useEffect(() => {
		if (query.trim()) {
			// Only proceed with a non-empty query
			window.ipc.send(buildKey([ID.VECTOR_STORE], { suffix: ":search" }), {
				query,
				options: { score_threshold },
			});
		} else {
			setResults([]); // Clear results if query is empty
		}
	}, [query, score_threshold]);

	// Effect to subscribe to vector store search results and errors
	useEffect(() => {
		// Subscription to receive search results
		const unsubscribeResult = window.ipc.on(
			buildKey([ID.VECTOR_STORE], { suffix: ":result" }),
			data => {
				console.log("Search result received:", data);
				setResults(data);
			}
		);
		// Subscription to handle any search errors
		const unsubscribeError = window.ipc.on(
			buildKey([ID.VECTOR_STORE], { suffix: ":error" }),
			error => {
				console.error("Search error:", error);
			}
		);

		// Cleanup function to unsubscribe from ipc channels when the component unmounts
		return () => {
			unsubscribeResult();
			unsubscribeError();
		};
	}, []);

	return results;
}
