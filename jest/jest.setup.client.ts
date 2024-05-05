// Define an interface for the mock if TypeScript doesn't include CSS or is missing properties/methods you need
interface CSSMock {
	escape: (input: string) => string;
}

// Assigning the mock to global.CSS with proper typing
if (typeof CSS === "undefined") {
	const mockCSS: CSSMock = {
		escape: (string_: string) => string_.replaceAll(/([()\\{}])/g, "\\$1"),
	};

	// Extend the existing global interface (if necessary) and assign the mock
	global.CSS = mockCSS as typeof CSS;
}
