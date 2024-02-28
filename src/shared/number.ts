export function randomSeed() {
	return Math.ceil(Math.random() * 1_000_000_000) + 1;
}
