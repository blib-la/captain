import type Store from "electron-store";
import { uniqBy } from "lodash";

export function pushToStore<T>(store: Store<any>, keyPath: string, data: T) {
	const items = store.get(keyPath, []);
	items.push(data);
	store.set(keyPath, uniqBy(items, "id"));
}
