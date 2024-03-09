import { useEffect, useState } from "react";
import { useDebounce } from "use-debounce";

import type { VectorStoreDocument } from "../../../electron/future/services/vector-store";

import { buildKey } from "#/build-key";
import { ID } from "#/enums";

export function useVectorStore(value: string) {
	const [query] = useDebounce(value, 1000);
	const [results, setResults] = useState<VectorStoreDocument[]>([]);

	useEffect(() => {
		if (query.trim()) {
			window.ipc.send(buildKey([ID.VECTOR_STORE], { suffix: ":search" }), query);
		}
	}, [query]);

	useEffect(() => {
		const unsubscribeResult = window.ipc.on(
			buildKey([ID.VECTOR_STORE], { suffix: ":result" }),
			data => {
				console.log(data);
				setResults(data);
			}
		);
		const unsubscribeError = window.ipc.on(
			buildKey([ID.VECTOR_STORE], { suffix: ":error" }),
			error => {
				console.log(error);
			}
		);
		return () => {
			unsubscribeResult();
			unsubscribeError();
		};
	}, []);
	return results;
}
