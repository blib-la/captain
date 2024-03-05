import type { RefObject } from "react";
import { useEffect, useState } from "react";

interface Size {
	width: number | undefined;
	height: number | undefined;
}

// Hook
export function useResizeObserver<T extends HTMLElement>(reference: RefObject<T>): Size {
	const [size, setSize] = useState<Size>({ width: undefined, height: undefined });

	useEffect(() => {
		if (reference.current === null) {
			return;
		}

		function handleResize(entries: ResizeObserverEntry[]) {
			if (!Array.isArray(entries)) {
				return;
			}

			// For simplicity, we'll only consider the first entry
			const entry = entries[0];

			// Use contentRect for border-box size
			setSize({
				width: entry.contentRect.width,
				height: entry.contentRect.height,
			});
		}

		const observer = new ResizeObserver(handleResize);

		observer.observe(reference.current);

		// Cleanup function
		return () => {
			observer.disconnect();
		};
	}, [reference]);

	return size;
}
