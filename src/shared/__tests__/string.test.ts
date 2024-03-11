import { extractH1Headings, getActionArguments } from "../string";

describe("extractH1Headings", () => {
	it("extracts multiple H1 headings", () => {
		const markdown = `# Heading 1
This is some text.

# Heading 2
More text follows.

## Heading 2.1
This is an H2 heading.

# Heading 3`;

		const expectedHeadings = ["Heading 1", "Heading 2", "Heading 3"];
		expect(extractH1Headings(markdown)).toEqual(expectedHeadings);
	});

	it("returns an empty array when there are no H1 headings", () => {
		const markdown = `This is some text without headings.

## Heading 2
This is an H2 heading.

### Heading 3
This is an H3 heading.`;

		expect(extractH1Headings(markdown)).toEqual([]);
	});
});

describe("getActionArguments", () => {
	it("parses command and captainId", () => {
		expect(getActionArguments("focus:color-mode-settings")).toEqual({
			command: "focus",
			captainId: "color-mode-settings",
			value: undefined,
			options: undefined,
		});
	});

	it("parses command, captainId, and value", () => {
		expect(getActionArguments("click:language-settings:English")).toEqual({
			command: "click",
			captainId: "language-settings",
			value: "English",
			options: undefined,
		});
	});

	it("parses command, captainId, value, and options", () => {
		expect(getActionArguments("type:feedback-form:this app is amazing|submit")).toEqual({
			command: "type",
			captainId: "feedback-form",
			value: "this app is amazing",
			options: "submit",
		});
	});

	it("handles special characters in value", () => {
		expect(getActionArguments("type:feedback-form:this app: amazing|submit")).toEqual({
			command: "type",
			captainId: "feedback-form",
			value: "this app: amazing",
			options: "submit",
		});
	});

	it("parses multiple options correctly", () => {
		expect(getActionArguments("type:feedback-form:this app is amazing|submit|urgent")).toEqual({
			command: "type",
			captainId: "feedback-form",
			value: "this app is amazing",
			options: "submit|urgent",
		});
	});
});
