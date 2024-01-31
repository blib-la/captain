import { useEffect, useRef, useState } from "react";

export interface PollingEffectOptions {
	interval: number;
	initialInterval?: number;
	initialCount?: number;
}

export function usePollingEffect(handler: () => void, options: PollingEffectOptions): void {
	const { interval, initialInterval, initialCount } = options;
	const savedHandler = useRef<() => void>();
	const [currentInterval, setCurrentInterval] = useState<number>(initialInterval ?? interval);
	const initialIterationsLeft = useRef(initialCount ?? 0);

	// Remember the latest handler.
	useEffect(() => {
		savedHandler.current = handler;
	}, [handler]);

	useEffect(() => {
		// Ensure the interval is a valid number.
		if (!currentInterval || currentInterval <= 0) {
			return;
		}

		function tick() {
			if (savedHandler.current) {
				savedHandler.current();
			}

			// Switch to the regular interval after the initial iterations
			if (initialIterationsLeft.current > 0) {
				initialIterationsLeft.current -= 1;
				if (initialIterationsLeft.current === 0) {
					setCurrentInterval(interval);
				}
			}
		}

		// Set up the interval.
		const id = setInterval(tick, currentInterval);

		// Clear the interval on unmount.
		return () => {
			clearInterval(id);
		};
	}, [currentInterval, interval]);
}
