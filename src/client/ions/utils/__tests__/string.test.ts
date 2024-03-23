import { capitalizeFirstLetter, replaceImagePlaceholders } from "../string";

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

describe("replaceImagePlaceholders", () => {
	it("replaces all image placeholders with corresponding URLs", () => {
		// Define a sample array of images
		const images: { filePath: string; id: string }[] = [
			{
				id: "img0",
				filePath: "./image0.png",
			},
			{
				id: "img1",
				filePath: "./image1.png",
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
		const images: { filePath: string; id: string }[] = []; // Empty array, simulating no matching images

		// Define a sample markdown string with placeholders
		const markdown = "This is an image: ![Image 2](2)";

		// Execute the function with the sample data
		const result = replaceImagePlaceholders(markdown, images);

		// Assert that the markdown remains unchanged
		expect(result).toEqual(markdown);
	});
});
