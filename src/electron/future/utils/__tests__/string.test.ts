import { parseJsonFromString } from "../string";

describe("parseJsonFromString", () => {
	it("parses JSON correctly from a string without code blocks", () => {
		const jsonString = '{ "key": "value" }';
		const parsed = parseJsonFromString(jsonString);
		expect(parsed).toEqual({ key: "value" });
	});

	it("extracts and parses JSON correctly from a string with code blocks", () => {
		const jsonStringWithCodeBlock = '```json\n{ "key": "value" }\n```';
		const parsed = parseJsonFromString(jsonStringWithCodeBlock);
		expect(parsed).toEqual({ key: "value" });
	});

	it("returns null for invalid JSON", () => {
		const invalidJsonString = '{ key: "value" '; // Deliberately malformed JSON
		const parsed = parseJsonFromString(invalidJsonString);
		expect(parsed).toBeNull();
	});

	it("ignores non-JSON code blocks and returns null", () => {
		const nonJsonCodeBlock = '```javascript\nconsole.log("Hello, world!");\n```';
		const parsed = parseJsonFromString(nonJsonCodeBlock);
		expect(parsed).toBeNull();
	});

	it("parses JSON correctly from a string with multiple code blocks", () => {
		const jsonStringWithMultipleCodeBlocks =
			'```json\n{ "key": "value1" }\n```\nSome text\n```json\n{ "key": "value2" }\n```';
		// Assuming the function is intended to parse the first code block it encounters
		const parsed = parseJsonFromString(jsonStringWithMultipleCodeBlocks);
		expect(parsed).toEqual({ key: "value1" });
	});
});
