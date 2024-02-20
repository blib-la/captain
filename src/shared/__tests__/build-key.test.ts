import { buildKey } from "../build-key";
import { ID } from "../enums";

describe("buildKey function", () => {
	it("should construct the key correctly with default options", () => {
		const result = buildKey([ID.STORE, ID.USER]);
		expect(result).toBe("____STORE--USER____");
	});

	it("should construct the key correctly with a custom delimiter", () => {
		const result = buildKey([ID.STORE, ID.USER], { delimiter: ":" });
		expect(result).toBe("____STORE:USER____");
	});

	it("should construct the key correctly with a custom prefix", () => {
		const result = buildKey([ID.STORE, ID.USER], { prefix: "start_" });
		expect(result).toBe("start_STORE--USER____");
	});

	it("should construct the key correctly with a custom suffix", () => {
		const result = buildKey([ID.STORE, ID.USER], { suffix: "_end" });
		expect(result).toBe("____STORE--USER_end");
	});

	it("should construct the key correctly with all custom options", () => {
		const result = buildKey([ID.STORE, ID.USER], {
			delimiter: ":",
			prefix: "start_",
			suffix: "_end",
		});
		expect(result).toBe("start_STORE:USER_end");
	});

	it("should handle a single key correctly", () => {
		const result = buildKey([ID.APP]);
		expect(result).toBe("____APP____");
	});

	it("should throw an error when no keys are provided", () => {
		expect(() => buildKey([])).toThrow("At least one key is required");
	});
});
