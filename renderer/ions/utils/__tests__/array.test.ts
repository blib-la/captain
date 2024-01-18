import { uniqueArray, getValueFromArray } from "../array";

describe("uniqueArray", () => {
	it("should remove duplicate numbers", () => {
		const array = [1, 2, 2, 3, 4, 4, 5];
		expect(uniqueArray(array)).toEqual([1, 2, 3, 4, 5]);
	});

	it("should remove duplicate strings", () => {
		const array = ["a", "b", "b", "c", "d", "d", "e"];
		expect(uniqueArray(array)).toEqual(["a", "b", "c", "d", "e"]);
	});

	it("should maintain order of initial appearance", () => {
		const array = [1, "a", "a", 2, "b", 2, "c"];
		expect(uniqueArray(array)).toEqual([1, "a", 2, "b", "c"]);
	});

	it("should return an empty array when given an empty array", () => {
		expect(uniqueArray([])).toEqual([]);
	});
});

describe("getValueFromArray", () => {
	it("should return undefined when item is undefined", () => {
		expect(getValueFromArray()).toBeUndefined();
	});

	it("should return undefined when item is an empty array", () => {
		expect(getValueFromArray([])).toBeUndefined();
	});

	it("should return the value of the first item when item has one or more elements", () => {
		const item = [
			{ _key: "1", _type: "type1", value: "value1" },
			{ _key: "2", _type: "type2", value: "value2" },
		];
		expect(getValueFromArray(item)).toBe("value1");
	});

	it("should handle different types of values", () => {
		const item = [{ _key: "1", _type: "type1", value: 123 }];
		expect(getValueFromArray(item)).toBe(123);
	});
});
