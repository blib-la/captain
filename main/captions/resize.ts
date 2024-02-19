/**
 * Resizes an image to ensure its area does not exceed a specified maximum area while maintaining the original aspect ratio.
 * If the original image's area is less than or equal to the maximum area, the original dimensions are returned.
 * If the original area exceeds the maximum area, the image is resized proportionally to reduce its area to the maximum allowed.
 *
 * @param {number} height - The original height of the image.
 * @param {number} width - The original width of the image.
 * @param {number} maxArea - The maximum allowed area for the image (height * width).
 * @returns {Object} An object containing the new or original height and width of the image.
 *         {number} height - The new or original height of the image.
 *         {number} width - The new or original width of the image.
 *
 * @example
 * // Resizes an image of 1600x1200 pixels to fit within a maximum area of 1024*1024 pixels
 * resizeImageKeepingAspectRatio(1200, 1600, 1024*1024);
 * // Returns: { height: 914, width: 1219 }
 *
 * @example
 * // Returns original dimensions for an image within the maximum area limit
 * resizeImageKeepingAspectRatio(800, 600, 1024*1024);
 * // Returns: { height: 800, width: 600 }
 */
export function resizeImageKeepingAspectRatio(height: number, width: number, maxArea: number) {
	const originalArea = height * width;
	if (originalArea <= maxArea) {
		return { height, width };
	}

	const scaleFactor = Math.sqrt(maxArea / originalArea);
	return {
		height: Math.floor(height * scaleFactor),
		width: Math.floor(width * scaleFactor),
	};
}
