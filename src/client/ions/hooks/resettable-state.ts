import { useCallback, useRef, useState } from "react";

export function useResettableState<T>(initialState: T, delay: number): [T, (value: T) => void] {
	// Use useState to manage the state
	const [state, setState] = useState<T>(initialState);
	const timer = useRef(-1);

	// A callback function that resets the state to its initial value after a delay
	const setTemporaryState = useCallback(
		(value: T) => {
			setState(value);

			timer.current = window.setTimeout(() => {
				setState(initialState);
			}, delay);
		},
		[initialState, delay]
	);

	return [state, setTemporaryState];
}
