import { renderHook, act } from "@testing-library/react";

import { useResettableState } from "../resettable-state";

describe("useResettableState hook", () => {
	jest.useFakeTimers();

	it("should initialize with the provided initial state", () => {
		const { result } = renderHook(() => useResettableState("initial", 1000));

		expect(result.current[0]).toBe("initial");
	});

	it("should allow state to be updated and reset after delay", () => {
		const { result } = renderHook(() => useResettableState("initial", 1000));

		act(() => {
			result.current[1]("updated");
		});

		expect(result.current[0]).toBe("updated");

		// Fast-forward time until all timers have been executed
		act(() => {
			jest.runAllTimers();
		});

		expect(result.current[0]).toBe("initial");
	});
});
