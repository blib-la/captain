import type { BrowserWindow, Display } from "electron";
import { screen } from "electron";

import {
	getCurrentPosition,
	windowWithinBounds,
	resetToDefaults,
	ensureVisibleOnSomeDisplay,
} from "../window";

// Mock Electron's screen module
jest.mock("electron", () => ({
	screen: {
		getPrimaryDisplay: jest.fn(),
		getAllDisplays: jest.fn(),
	},
	BrowserWindow: jest.fn(() => ({
		getPosition: jest.fn(),
		getSize: jest.fn(),
	})),
}));

describe("Electron Window Utilities", () => {
	const mockGetPrimaryDisplay = screen.getPrimaryDisplay as jest.MockedFunction<
		typeof screen.getPrimaryDisplay
	>;
	const mockGetAllDisplays = screen.getAllDisplays as jest.MockedFunction<
		typeof screen.getAllDisplays
	>;

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("getCurrentPosition returns the correct position and size of the window", () => {
		const mockWindow = {
			getPosition: jest.fn().mockReturnValue([100, 100]),
			getSize: jest.fn().mockReturnValue([800, 600]),
		} as unknown as BrowserWindow;

		const position = getCurrentPosition(mockWindow);
		expect(position).toEqual({ x: 100, y: 100, width: 800, height: 600 });
	});

	it("windowWithinBounds checks if window is within specified bounds", () => {
		const windowState = { x: 100, y: 100, width: 800, height: 600 };
		const bounds = { x: 0, y: 0, width: 1920, height: 1080 };

		const isWithinBounds = windowWithinBounds(windowState, bounds);
		expect(isWithinBounds).toBe(true);
	});

	it("resetToDefaults centers window on the primary display with default size", () => {
		mockGetPrimaryDisplay.mockReturnValue({
			bounds: { x: 0, y: 0, width: 1920, height: 1080 },
		} as Display);

		const defaultSize = { width: 800, height: 600 };
		const newState = resetToDefaults(defaultSize);

		expect(newState).toEqual({
			width: 800,
			height: 600,
			x: (1920 - 800) / 2,
			y: (1080 - 600) / 2,
		});
	});

	it("ensureVisibleOnSomeDisplay resets window if not visible on any display", () => {
		mockGetAllDisplays.mockReturnValue([
			{ bounds: { x: 0, y: 0, width: 1920, height: 1080 } } as Display,
		]);

		const windowState = { x: -2000, y: 100, width: 800, height: 600 };
		const defaultSize = { width: 800, height: 600 };
		const newState = ensureVisibleOnSomeDisplay(windowState, defaultSize);

		expect(newState).toEqual(resetToDefaults(defaultSize));
	});

	it("ensureVisibleOnSomeDisplay keeps window state if visible on a display", () => {
		mockGetAllDisplays.mockReturnValue([
			{ bounds: { x: 0, y: 0, width: 1920, height: 1080 } } as Display,
		]);

		const windowState = { x: 100, y: 100, width: 800, height: 600 };
		const defaultSize = { width: 800, height: 600 };
		const newState = ensureVisibleOnSomeDisplay(windowState, defaultSize);

		expect(newState).toEqual(windowState);
	});
});
