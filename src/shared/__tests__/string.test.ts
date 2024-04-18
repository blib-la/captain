import { cleanPath, extractH1Headings, getFileType } from "../string";

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

describe("getFileType", () => {
	it("identifies markdown files", () => {
		expect(getFileType("example.md")).toBe("markdown");
	});

	it("identifies image files", () => {
		const imageExtensions = [".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp", ".svg"];
		for (const extension of imageExtensions) {
			expect(getFileType(`example${extension}`)).toBe("image");
		}
	});

	it("identifies audio files", () => {
		const audioExtensions = [".mp3", ".wav", ".aac", ".ogg", ".flac"];
		for (const extension of audioExtensions) {
			expect(getFileType(`song${extension}`)).toBe("audio");
		}
	});

	it("defaults to other for unknown extensions", () => {
		expect(getFileType("example.txt")).toBe("other");
		expect(getFileType("archive.zip")).toBe("other");
	});
});

describe("cleanPath", () => {
	it("should handle simple paths without traversal", () => {
		expect(cleanPath("foo/bar/baz")).toBe("foo/bar/baz");
	});

	it('should resolve paths with "." to the same path', () => {
		expect(cleanPath("./foo/./bar/./baz")).toBe("foo/bar/baz");
	});

	it('should correctly handle paths with ".." to move up directories', () => {
		expect(cleanPath("foo/bar/baz/../../qux")).toBe("foo/qux");
	});

	it("should return root when moving back past the root", () => {
		expect(cleanPath("../../../foo")).toBe("foo");
	});

	it("should ignore empty segments caused by consecutive slashes", () => {
		expect(cleanPath("foo//bar///baz")).toBe("foo/bar/baz");
	});

	it("should handle complex mixed paths", () => {
		expect(cleanPath("../../../foo/bar/./../../baz")).toBe("baz");
	});

	it("should return a root slash for completely empty paths", () => {
		expect(cleanPath("")).toBe("");
	});

	it("should return a root slash for paths that resolve to the root", () => {
		expect(cleanPath("../../../../")).toBe("");
	});
});
