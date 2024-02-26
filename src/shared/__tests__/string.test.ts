import { extractH1Headings } from "../string";

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
