import {
	getContrast,
	getContrastColor,
	getRelativeLuminance,
	hexToRGB,
	mixColors,
	rgbToHex,
} from "../color";

describe("getContrastColor", () => {
	it("should return black for light colors", () => {
		const result = getContrastColor("#FFFFFF");
		expect(result).toBe("black");
	});

	it("should return white for dark colors", () => {
		const result = getContrastColor("#000000");
		expect(result).toBe("white");
	});

	it("should return black for medium-light colors", () => {
		const result = getContrastColor("#7BAFD4");
		expect(result).toBe("black");
	});

	it("should return white for medium-dark colors", () => {
		const result = getContrastColor("#4B372B");
		expect(result).toBe("white");
	});

	it("should remove leading hash from hex color", () => {
		const result = getContrastColor("#FFFFFF");
		expect(result).toBe("black");
	});
});

describe("getRelativeLuminance", () => {
	// Precision might be needed due to floating point calculations
	const precision = 0.0001;

	it("should return correct luminance for colors with channels below 0.03928", () => {
		// Example: dark grayish blue
		expect(getRelativeLuminance([10, 10, 40])).toBeCloseTo(0.0057, precision);
	});

	it("should return correct luminance for colors with channels above 0.03928", () => {
		// Example: light grayish yellow
		expect(getRelativeLuminance([220, 220, 180])).toBeCloseTo(0.7395, precision);
	});

	it("should return correct luminance for mixed colors", () => {
		// Example: medium aqua
		expect(getRelativeLuminance([0, 123, 167])).toBeCloseTo(0.1807, precision);
	});

	it("should handle edge cases", () => {
		expect(getRelativeLuminance([255, 255, 255])).toBeCloseTo(1, precision); // Pure white
		expect(getRelativeLuminance([0, 0, 0])).toBeCloseTo(0, precision); // Pure black
	});
});

describe("hexToRGB", () => {
	it("should correctly convert shorthand HEX to RGB", () => {
		expect(hexToRGB("#123")).toEqual([17, 34, 51]);
	});

	it("should correctly convert regular HEX to RGB", () => {
		expect(hexToRGB("#112233")).toEqual([17, 34, 51]);
	});

	it("should handle mixed case HEX values", () => {
		expect(hexToRGB("#AaBbCc")).toEqual([170, 187, 204]);
	});

	it("should throw error for invalid HEX", () => {
		expect(() => hexToRGB("#GGG")).toThrow("Invalid HEX color.");
		expect(() => hexToRGB("invalid")).toThrow("Invalid HEX color.");
	});

	it("should handle HEX values without the leading #", () => {
		expect(hexToRGB("AABBCC")).toEqual([170, 187, 204]);
	});
});

describe("getContrast", () => {
	it("should calculate correct contrast and meet AA standards", () => {
		const result = getContrast("#ffffff", "#767676");
		expect(result.contrast).toBeCloseTo(4.54, 2);
		expect(result.aa).toBeTruthy();
		expect(result.aaa).toBeFalsy();
	});

	it("should calculate correct contrast and meet AAA standards", () => {
		const result = getContrast("#ffffff", "#595959");
		expect(result.contrast).toBeCloseTo(7, 2);
		expect(result.aa).toBeTruthy();
		expect(result.aaa).toBeTruthy();
	});

	it("should calculate correct contrast and not meet any standard", () => {
		const result = getContrast("#ffffff", "#a1a1a1");
		expect(result.contrast).toBeCloseTo(2.58, 2);
		expect(result.aa).toBeFalsy();
		expect(result.aaa).toBeFalsy();
	});

	it("should return same result regardless of order", () => {
		const result1 = getContrast("#ffffff", "#595959");
		const result2 = getContrast("#595959", "#ffffff");
		expect(result1).toEqual(result2);
	});
});

describe("mixColors", () => {
	it("should mix two colors evenly when percentage is 0.5", () => {
		const result = mixColors("#ff0000", "#0000ff", 0.5);
		expect(result).toBe("#800080");
	});

	it("should return color1 when percentage is 0", () => {
		const result = mixColors("#ff0000", "#0000ff", 0);
		expect(result).toBe("#ff0000");
	});

	it("should return color2 when percentage is 1", () => {
		const result = mixColors("#ff0000", "#0000ff", 1);
		expect(result).toBe("#0000ff");
	});

	it("should correctly mix two colors with a non-50% percentage", () => {
		const result = mixColors("#ffffff", "#000000", 0.25);
		expect(result).toBe("#bfbfbf");
	});

	it("should handle invalid percentage by clamping to valid range", () => {
		const result = mixColors("#ff0000", "#0000ff", -0.1);
		expect(result).toBe("#ff0000");
	});
});

describe("rgbToHex", () => {
	it("should correctly convert RGB to HEX", () => {
		expect(rgbToHex(255, 255, 255)).toBe("#ffffff");
		expect(rgbToHex(0, 0, 0)).toBe("#000000");
		expect(rgbToHex(173, 216, 230)).toBe("#add8e6");
	});

	it("should handle single digit hex values by padding with zero", () => {
		expect(rgbToHex(1, 2, 3)).toBe("#010203");
	});

	it("should throw error for invalid RGB values", () => {
		expect(() => rgbToHex(256, 0, 0)).toThrow("Invalid RGB value.");
		expect(() => rgbToHex(0, -1, 0)).toThrow("Invalid RGB value.");
		expect(() => rgbToHex(0, 0, 300)).toThrow("Invalid RGB value.");
	});
});
