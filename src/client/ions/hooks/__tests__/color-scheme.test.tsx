import type { Mode } from "@mui/system/cssVars/useCurrentColorScheme";
import { renderHook, act } from "@testing-library/react";

import { useSsrColorScheme } from "../color-scheme";

function createMockUseColorScheme(initialMode = "system") {
	let internalMode = initialMode;

	return jest.fn().mockImplementation(() => ({
		mode: internalMode,
		setMode(newMode: Mode) {
			internalMode = newMode;
		},
	}));
}

jest.mock("@mui/joy/styles", () => ({
	useColorScheme: createMockUseColorScheme(),
}));

describe("useSsrColorScheme", () => {
	beforeEach(() => {
		Object.defineProperty(window, "ipc", {
			value: {
				send: jest.fn(),
				on: jest.fn(() => jest.fn()),
			},
			configurable: true,
		});
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it("should set initial mode to 'system'", () => {
		const { result } = renderHook(() => useSsrColorScheme());
		expect(result.current.mode).toBe("system");
	});

	it("should change mode when setMode is called", () => {
		const { result, rerender } = renderHook(() => useSsrColorScheme()); // Get the rerender function

		act(() => {
			result.current.setMode("light");
		});

		rerender();

		expect(result.current.mode).toBe("light");
	});
});
