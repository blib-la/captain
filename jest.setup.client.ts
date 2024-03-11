import "@testing-library/jest-dom";

if (typeof CSS === "undefined") {
	global.CSS = {
		escape: (string_: string) => string_.replaceAll(/([()\\{}])/g, "\\$1"),
	} as any; // Cast to 'any' to bypass TypeScript's type checking for the mock.
}
