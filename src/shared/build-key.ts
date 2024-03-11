import type { ID, KEY } from "./enums";

/**
 * Constructs a storage key using a combination of provided keys and optional formatting parameters.
 * This function is pivotal in creating distinguishable and structured keys for different data stores,
 * allowing for clear separation of concerns within the application's persisted state.
 *
 * @param keys - Array of `ID` enum members representing the segments of the data store being addressed.
 * @param options - Object with optional `delimiter`, `prefix`, and `suffix` to customize the key format.
 *                  These formatting options provide flexibility in key generation, catering to potential
 *                  naming conventions or integration requirements.
 * @returns A string representing the fully formatted key, incorporating the specified segments and formatting.
 * @throws {Error} If the `keys` array is empty, indicating that at least one key is required for key generation.
 */
export function buildKey(keys: (ID | KEY)[], { delimiter = "-", prefix = "", suffix = "" } = {}) {
	if (keys.length === 0) {
		throw new Error("At least one key is required");
	}

	return [prefix, keys.join(delimiter), suffix].join("");
}
