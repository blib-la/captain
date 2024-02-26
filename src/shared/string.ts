/**
 * Extracts H1 headings from a Markdown string.
 *
 * This function uses a regular expression to find lines in the Markdown text that start
 * with '# ' (indicating an H1 heading in Markdown syntax) and returns an array of the
 * headings found, excluding the '# ' prefix.
 *
 * @param {string} markdownText - The Markdown text to search for H1 headings.
 * @returns {string[]} An array of strings, each representing an H1 heading found in the input text.
 */
export function extractH1Headings(markdownText: string) {
	// Define a regular expression to match H1 headings in Markdown
	const h1Regex = /^#\s(.+)/gm;

	const headings = [];
	let match;

	// Use a loop to extract all matches from the Markdown text
	while ((match = h1Regex.exec(markdownText)) !== null) {
		// The first capturing group contains the heading text
		headings.push(match[1]);
	}

	return headings;
}
