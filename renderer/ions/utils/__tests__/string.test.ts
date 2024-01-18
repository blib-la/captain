import { capitalizeFirstLetter } from "../string";

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
