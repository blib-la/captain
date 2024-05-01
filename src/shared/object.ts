/**
 * Creates a replacer function for JSON.stringify to safely handle circular references.
 * The replacer function can be used as a second argument to JSON.stringify to
 * prevent it from throwing errors on circular references within the object being stringified.
 *
 * @returns { (key: string, value: any) => any } A replacer function that safely serializes objects
 * containing circular references.
 */
export function getCircularReplacer(): (key: string, value: unknown) => unknown {
	const seen = new WeakSet();
	return (_key: string, value: unknown): unknown => {
		if (typeof value === "object" && value !== null) {
			if (seen.has(value)) {
				// If a circular reference is detected, avoid infinite loops by returning undefined.
				return;
			}

			seen.add(value);
		}

		return value;
	};
}

/**
 * Serializes a given object into a JSON string while safely handling circular references.
 * This function uses a custom replacer to manage circular dependencies encountered during stringification,
 * preventing `JSON.stringify` from throwing errors.
 *
 * @param {Record<string, unknown>} object_ - The object to be serialized to JSON. This must be a record with
 *                                            string keys and values of unknown types.
 * @returns {string} A JSON string representation of the object, with circular references handled gracefully.
 */
export function jsonStringify(object_: Record<string, unknown>) {
	return JSON.stringify(object_, getCircularReplacer());
}
