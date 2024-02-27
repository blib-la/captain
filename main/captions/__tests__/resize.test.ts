import { resizeImageKeepingAspectRatio } from "../resize";

describe("resizeImageKeepingAspectRatio", () => {
	it("should return original dimensions for images within the max area limit", () => {
		const originalHeight = 800;
		const originalWidth = 600;
		const maxArea = 1024 * 1024; // 1,048,576
		const result = resizeImageKeepingAspectRatio(originalHeight, originalWidth, maxArea);
		expect(result).toEqual({ height: originalHeight, width: originalWidth });
	});

	it("should resize an image that exceeds the max area limit to fit within it, maintaining aspect ratio", () => {
		const originalHeight = 3072;
		const originalWidth = 1280;
		const maxArea = 1024 * 1024; // 1,048,576
		const result = resizeImageKeepingAspectRatio(originalHeight, originalWidth, maxArea);
		expect(result.height * result.width).toBeLessThanOrEqual(maxArea);
		expect(result.height).toBeGreaterThanOrEqual(1536);
		expect(result.width).toBeGreaterThanOrEqual(640);
	});

	it("should handle zero and negative inputs gracefully", () => {
		const height = 0;
		const width = -200;
		const maxArea = 1024 * 1024;
		const result = resizeImageKeepingAspectRatio(height, width, maxArea);
		// Depending on your function's implementation, adjust the expected result
		// Here we assume it returns the input as is, but you might have error handling instead
		expect(result).toEqual({ height: 0, width: -200 });
	});
});
