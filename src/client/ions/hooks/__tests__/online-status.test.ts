import { renderHook, act } from "@testing-library/react";

import { useOnlineStatus } from "../online-status";

function mockNavigatorOnLine(online: boolean) {
	Object.defineProperty(navigator, "onLine", {
		value: online,
		configurable: true, // This allows the property to be redefined in future tests
	});
}

describe("useOnlineStatus", () => {
	const originalNavigator = global.navigator;

	beforeAll(() => {
		global.navigator = {
			...navigator,
			onLine: true,
		};
	});

	afterAll(() => {
		global.navigator = originalNavigator;
	});

	it("should return true when online", () => {
		mockNavigatorOnLine(true);
		const { result } = renderHook(() => useOnlineStatus());
		expect(result.current).toBe(true);
	});

	it("should return false when offline", () => {
		mockNavigatorOnLine(false);
		const { result } = renderHook(() => useOnlineStatus());
		expect(result.current).toBe(false);
	});

	it("should update status when the online and offline events are triggered", () => {
		const { result } = renderHook(() => useOnlineStatus());

		act(() => {
			mockNavigatorOnLine(false);
			window.dispatchEvent(new Event("offline"));
		});
		expect(result.current).toBe(false);

		act(() => {
			mockNavigatorOnLine(true);
			window.dispatchEvent(new Event("online"));
		});
		expect(result.current).toBe(true);
	});
});
