import type Store from "electron-store";
import { uniqBy } from "lodash";

export function pushToStore<T>(store: Store<Record<string, unknown>>, keyPath: string, data: T) {
	const items = store.get(keyPath, []) as unknown[];
	items.push(data);
	store.set(keyPath, uniqBy(items, "id"));
}
