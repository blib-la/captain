import { DownloadState } from "@captn/utils/constants";

import type { DownloadsSettings } from "@/electron/types";

/**
 * Modifies the state if it matches a specific condition.
 * @param state The current state as a string.
 * @returns The modified state.
 */
export function modifyState(state: DownloadState): DownloadState {
	if (state === DownloadState.RESTART) {
		return DownloadState.DONE;
	}

	return state;
}

/**
 * Recursively traverses and modifies a tree structure.
 * @param tree The tree to traverse and modify.
 * @returns The modified tree.
 */
export function traverseAndModify(tree: DownloadsSettings) {
	const modifiedTree: DownloadsSettings = {};
	for (const key in tree) {
		if (Object.hasOwn(tree, key)) {
			const value = tree[key];
			// Apply modifyState if it's a string, otherwise, recurse into the nested tree
			modifiedTree[key] =
				typeof value === "string" ? modifyState(value) : traverseAndModify(value);
		}
	}

	return modifiedTree;
}
