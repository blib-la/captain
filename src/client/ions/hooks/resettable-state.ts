import { useCallback, useRef, useState } from "react";

export function useResettableState<T>(initialState: T, delay: number): [T, (value: T) => void] {
	const [state, setState] = useState<T>(initialState);
	const timer = useRef(-1);

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
