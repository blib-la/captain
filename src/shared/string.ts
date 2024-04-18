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
export function extractH1Headings(markdownText: string): string[] {
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

/**
 * Parses a given action string into its constituent components: command, captainId, value, and options.
 *
 * The action string is structured to command actions within the application, following the format:
 * - "command:captainId" for actions without additional data.
 * - "command:captainId:value" for actions with data but without options.
 * - "command:captainId:value|options" for actions with both data and options.
 *
 * Here, "captainId" refers to the `data-captainid` attribute of an HTML element, identifying the target for the command.
 *
 * @param {string} action - The action string to be parsed, incorporating the command, target element's captainId, optional value, and optional options.
 * @returns An object containing the parsed parts of the action: { command, captainId, value, options }.
 *   - `command`: The action to perform (e.g., focus, click, type).
 *   - `captainId`: Identifier for the target element (matches `data-captainid` attribute).
 *   - `value`: Optional data relevant to the command (e.g., text to type).
 *   - `options`: Additional parameters or instructions (e.g., "submit" to indicate form submission after typing).
 *
 * @example
 * // Example 1: Focus on an element with specific captainId
 * getActionArguments("focus:color-mode-settings");
 * // Returns: { command: "focus", captainId: "color-mode-settings", value: undefined, options: undefined }
 *
 * @example
 * // Example 2: Click an element with specific captainId
 * getActionArguments("click:language-settings");
 * // Returns: { command: "click", captainId: "language-settings", value: undefined, options: undefined }
 *
 * @example
 * // Example 3: Type into a form and submit
 * getActionArguments("type:feedback-form:this app is amazing|submit");
 * // Returns: { command: "type", captainId: "feedback-form", value: "this app is amazing", options: "submit" }
 */
export function getActionArguments(action: string) {
	const [command, captainId, ...rest] = action.split(":");

	let value: string | undefined;
	let options: string | undefined;

	// Check if there are any elements in 'rest', indicating that a 'value' was provided.
	if (rest.length > 0) {
		// The 'value' may contain "|" indicating further options. Split and assign accordingly.
		// Join 'rest' back in case the value contained ":" which was split earlier.
		const lastPart = rest.join(":");
		const parts = lastPart.split("|");

		// Assign 'value' from the first part. If there are options, assign them as well.
		value = parts[0];
		if (parts.length > 1) {
			options = parts.slice(1).join("|"); // Join back any additional "|" split parts as part of options.
		}
	}

	return { command, captainId, value, options } as const;
}

/**
 * Determines the file type based on its extension.
 *
 * This function examines the extension of the provided file path and categorizes it into
 * one of the predetermined types: 'image', 'markdown', 'audio', or 'other'.
 *
 * @param {string} filePath The complete path of the file including its name and extension.
 * @returns {string} The category of the file based on its extension. Possible return values
 * are 'image', 'markdown', 'audio', or 'other'.
 */
export function getFileType(filePath: string) {
	const extension = `.${filePath.split(".").pop()?.toLowerCase() ?? ""}`;

	if ([".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp", ".svg"].includes(extension)) {
		return "image";
	}

	if (extension === ".md") {
		return "markdown";
	}

	if ([".mp3", ".wav", ".aac", ".ogg", ".flac"].includes(extension)) {
		return "audio";
	}

	return "other";
}

/**
 * Cleans a given pathname by removing any directory traversal characters.
 * @param {string} pathname - The path to be cleaned.
 * @returns {string} The cleaned path.
 */
export function cleanPath(pathname: string): string {
	const segments = pathname.split("/");
	const stack: string[] = [];

	for (const segment of segments) {
		if (segment === "..") {
			// Only pop the stack if there's something to go back from
			if (stack.length > 0) {
				stack.pop();
			}
		} else if (segment !== "." && segment !== "") {
			// Ignore '.' which represents current directory
			// Ignore empty segments caused by consecutive slashes
			stack.push(segment);
		}
	}

	return stack.join("/");
}
