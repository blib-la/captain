/**
 * Creates a unique array by removing duplicate elements.
 */
export function uniqueArray<T>(array: T[]): T[] {
	return [...new Set(array)];
}

/*
 * Gets the value key of the first element of an array
 */
export function getValueFromArray<T>(item?: { _key: string; _type: string; value: T }[]) {
	return item && item[0]?.value;
}
