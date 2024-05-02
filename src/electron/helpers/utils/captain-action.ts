import type { VectorStoreDocument } from "@captn/utils/types";
import { getProperty } from "dot-prop";

import { userStore } from "@/electron/stores";
/**
 * Defines a tree structure where each key can either be another `FunctionTree` or a function that takes
 * a properties object and performs an action. This structure allows for nested, dynamic function calls.
 */
export interface FunctionTree {
	[key: string]: FunctionTree | ((properties: Record<string, unknown>) => void);
}

/**
 * An implementation of the `FunctionTree` interface to store functions related to user data management.
 * It currently includes a `set` function for updating user store properties.
 */
export const functions: FunctionTree = {
	userStore: {
		set(properties: Record<string, unknown>) {
			for (const key in properties) {
				if (Object.hasOwn(properties, key)) {
					userStore.set(key, properties[key]);
				}
			}
		},
	},
};

/**
 * Handles actions directed at the `captain` entity by invoking functions specified by a function path within the `functions` tree.
 * The function to be invoked is determined based on the provided `functionPath`, and it is called with the provided `parameters`.
 *
 * @param {{id: string; parameters: Record<string, unknown>}} payload - An object containing the details of the action to be performed.
 * - id: The path to the function within the `functions` tree.
 * - parameters: The parameters to be passed to the function.
 */
export function handleCaptainAction({
	id: functionPath,
	parameters,
}: VectorStoreDocument["payload"]) {
	const function_ = getProperty(functions, functionPath);
	if (typeof function_ === "function") {
		function_(parameters ?? {});
	}
}
