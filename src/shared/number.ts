/**
 * Generates a random seed as a positive integer. The seed ranges from 1 to 2^32 (4294967296).
 * This function uses JavaScript's Math.random() to generate a fractional random number
 * and scales it up to the desired range.
 *
 * @returns {number} A random seed as an integer between 1 and 4294967296 inclusive.
 */
export function randomSeed() {
	return Math.ceil(Math.random() * 2 ** 32) + 1;
}
