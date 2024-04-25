import JSON5 from "json5";

export function parseJsonFromString(inputString: string) {
	// Regular expression to match code blocks with or without language specifier
	const codeBlockRegex = /```(?:\w*\n)?([\S\s]*?)```/;

	// Check for and remove code blocks if they exist
	const match = inputString.match(codeBlockRegex);
	if (match) {
		inputString = match[1];
	}

	// Trim any leading or trailing whitespace
	inputString = inputString.trim();

	// Parse and return the JSON
	try {
		return JSON5.parse(inputString);
	} catch (error) {
		console.log("Error parsing JSON:", error);
		return null;
	}
}
