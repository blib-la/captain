import type { Rectangle } from "electron";
import { type BrowserWindow, screen } from "electron";

/**
 * Retrieves the current position and size of the given BrowserWindow.
 *
 * @param {BrowserWindow} win - The Electron BrowserWindow instance.
 * @returns {Rectangle} An object containing x and y coordinates, and width and height of the window.
 */
export function getCurrentPosition(win: BrowserWindow): Rectangle {
	const position = win.getPosition();
	const size = win.getSize();
	return {
		x: position[0],
		y: position[1],
		width: size[0],
		height: size[1],
	};
}

/**
 * Checks if a window's state is within the specified bounds.
 *
 * @param {Rectangle} windowState - The state of the window, including position and size.
 * @param {Rectangle} bounds - The bounding rectangle to compare against.
 * @returns {boolean} Returns true if the window's state is within the bounds, otherwise false.
 */
export function windowWithinBounds(windowState: Rectangle, bounds: Rectangle): boolean {
	return (
		windowState.x >= bounds.x &&
		windowState.y >= bounds.y &&
		windowState.x + windowState.width <= bounds.x + bounds.width &&
		windowState.y + windowState.height <= bounds.y + bounds.height
	);
}

/**
 * Resets the window size to default values and centers it on the primary display.
 *
 * @param {{ width: number; height: number }} defaultSize - The default width and height for the window.
 * @returns {Rectangle} The new window state with default size and centered position.
 */
export function resetToDefaults(defaultSize: { width: number; height: number }): Rectangle {
	const { bounds } = screen.getPrimaryDisplay();
	return {
		...defaultSize,
		x: (bounds.width - defaultSize.width) / 2,
		y: (bounds.height - defaultSize.height) / 2,
	};
}

/**
 * Ensures that the window is visible on at least one display.
 * If the window is not visible, resets it to default size and position.
 *
 * @param {Rectangle} windowState - The current state of the window.
 * @param {{ width: number; height: number }} defaultSize - The default size of the window.
 * @returns {Rectangle} The adjusted window state, ensuring it's visible on a display.
 */
export function ensureVisibleOnSomeDisplay(
	windowState: Rectangle,
	defaultSize: { width: number; height: number }
): Rectangle {
	const visible = screen
		.getAllDisplays()
		.some(display => windowWithinBounds(windowState, display.bounds));
	if (!visible) {
		// If the window is not visible on any display, reset it to default size and center it.
		return resetToDefaults(defaultSize);
	}

	// If the window is visible, return the current state.
	return windowState;
}
