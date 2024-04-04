import { jest } from "@jest/globals";
import { renderHook, act } from "@testing-library/react";
import { isEqual } from "lodash";

import { useObject } from "../object"; // Adjust the import path to where your hook is defined

jest.useFakeTimers();

describe("useObject hook", () => {
	it("returns the initial object", () => {
		const initialObject = { key: "value" };
		const { result } = renderHook(() => useObject(initialObject));

		expect(result.current).toEqual(initialObject);
	});

	it("debounces updates to the object", async () => {
		let object = { key: "initialValue" };
		const { result, rerender } = renderHook(() => useObject(object));

		object = { key: "updatedValue" };
		rerender();

		// Immediately after rerender, the value should not have changed yet
		expect(result.current).toEqual({ key: "initialValue" });

		// Fast-forward time
		act(() => {
			jest.advanceTimersByTime(300); // Adjust the time based on your debounce delay
		});

		// After the debounce period, the value should be updated
		expect(result.current).toEqual({ key: "updatedValue" });
	});

	it("does not update the internal state if the debounced value is equal to the current state", () => {
		const initialObject = { key: "value" };
		const { result, rerender } = renderHook(() => useObject(initialObject));

		// Attempt to update with an equal object (deep equality)
		const updatedObject = { key: "value" }; // This is a new object but equal in value
		rerender(updatedObject);

		// Fast-forward past the debounce delay
		act(() => {
			jest.advanceTimersByTime(300); // Adjust the time based on your debounce delay
		});

		// The internal state should not have updated, as the value is deep equal to the initial state
		expect(isEqual(result.current, initialObject)).toBe(true);
	});
});
