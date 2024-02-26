import { capitalizeFirstLetter, localFile, replaceImagePlaceholders } from "../string";

import { LOCAL_PROTOCOL } from "#/constants";
import type { ImageItem } from "#/types";

describe("capitalizeFirstLetter", () => {
	it("should capitalize the first letter of a string", () => {
		expect(capitalizeFirstLetter("hello")).toBe("Hello");
	});

	it("should return the same string if first letter is already capitalized", () => {
		expect(capitalizeFirstLetter("World")).toBe("World");
	});

	it("should return an empty string if input is an empty string", () => {
		expect(capitalizeFirstLetter("")).toBe("");
	});

	it("should not modify strings that start with non-alphabetic characters", () => {
		expect(capitalizeFirstLetter("123hello")).toBe("123hello");
	});
});

// Import the function to test

describe("replaceImagePlaceholders", () => {
	it("replaces all image placeholders with corresponding URLs", () => {
		// Define a sample array of images
		const images: ImageItem[] = [
			{
				id: "img0",
				dataUrl: "data:image/png;base64,...",
				url: "http://example.com/image0.png",
			},
			{
				id: "img1",
				dataUrl: "data:image/png;base64,...",
				url: "http://example.com/image1.png",
			},
		];

		// Define a sample markdown string with placeholders
		const markdown =
			"Here is the first image: ![Image 0](0) and here is the second image: ![Image 1](1)";

		// Expected result after replacing placeholders with URLs
		const expectedResult =
			"Here is the first image: ![Image 0](./1.png) and here is the second image: ![Image 1](./2.png)";

		// Execute the function with the sample data
		const result = replaceImagePlaceholders(markdown, images);

		// Assert that the result matches the expected result
		expect(result).toEqual(expectedResult);
	});

	it("leaves the markdown unchanged if no corresponding images are found", () => {
		// Define a sample array of images
		const images: ImageItem[] = []; // Empty array, simulating no matching images

		// Define a sample markdown string with placeholders
		const markdown = "This is an image: ![Image 2](2)";

		// Execute the function with the sample data
		const result = replaceImagePlaceholders(markdown, images);

		// Assert that the markdown remains unchanged
		expect(result).toEqual(markdown);
	});
});

describe("localFile", () => {
	it("should format the file path with the custom protocol correctly", () => {
		const filePath = "C:/foo/bar/baz.png";
		const expected = `${LOCAL_PROTOCOL}://${filePath}`;
		expect(localFile(filePath)).toBe(expected);
	});

	it("should handle file paths with spaces correctly", () => {
		const filePath = "C:/foo/bar/with space.png";
		const expected = `${LOCAL_PROTOCOL}://${filePath}`;
		expect(localFile(filePath)).toBe(expected);
	});

	it("should handle custom protocols", () => {
		const filePath = "C:/foo/bar/with space.png";
		const expected = `test://${filePath}`;
		expect(localFile(filePath, { localProtocol: "test" })).toBe(expected);
	});
});
