import { getCircularReplacer, jsonStringify } from "../object";

describe("getCircularReplacer", () => {
	it("should return a function", () => {
		expect(typeof getCircularReplacer()).toBe("function");
	});

	it("should handle non-circular objects", () => {
		const object = { a: 1, b: 2 };
		const replacer = getCircularReplacer();
		expect(JSON.stringify(object, replacer)).toBe(JSON.stringify(object));
	});

	it("should handle circular objects by returning undefined for circular references", () => {
		const object: Record<string, unknown> = { a: 1 };
		object.b = object;
		const replacer = getCircularReplacer();
		expect(JSON.stringify(object, replacer)).toBe(JSON.stringify({ a: 1 }));
	});
});

describe("jsonStringify", () => {
	it("should serialize non-circular objects correctly", () => {
		const object = { name: "Test", id: 123 };
		expect(jsonStringify(object)).toBe(JSON.stringify(object));
	});

	it("should serialize circular objects without throwing an error", () => {
		const object: Record<string, unknown> = { name: "Test" };
		object.self = object;
		expect(() => jsonStringify(object)).not.toThrow();
		expect(jsonStringify(object)).toContain('{"name":"Test"}');
	});
});
