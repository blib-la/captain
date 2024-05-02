import type { RefObject } from "react";
import { useEffect, useState } from "react";

/**
 * Represents the size of an HTML element with possible undefined values initially.
 *
 * @interface Size
 * @property {number | undefined} width - The width of the element in pixels, or undefined if not set.
 * @property {number | undefined} height - The height of the element in pixels, or undefined if not set.
 */
export interface Size {
	width: number | undefined;
	height: number | undefined;
}

/**
 * Custom hook for monitoring and responding to changes in size of a referenced HTML element.
 *
 * This hook provides a convenient way to get the current width and height of an element
 * when it resizes. The hook observes the element referred to by the passed `reference`
 * and updates the size state whenever the element's size changes.
 *
 * @param {RefObject<T>} reference - React ref object pointing to the target element to be observed.
 * @returns {Size} The size of the observed element. The `Size` object contains two properties:
 *                 `width` and `height`, which represent the current dimensions of the element in pixels.
 *                 Both properties are initially `undefined` and get updated upon each resize event.
 *
 * @template T - The HTML element type that extends HTMLElement which is targeted by the ref object.
 *
 * @example
 * const ref = useRef<HTMLDivElement>(null);
 * const size = useResizeObserver(ref);
 * console.log(size); // { width: 1024, height: 768 }
 */
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

			const entry = entries[0];

			setSize({
				width: entry.contentRect.width,
				height: entry.contentRect.height,
			});
		}

		const observer = new ResizeObserver(handleResize);

		observer.observe(reference.current);

		return () => {
			observer.disconnect();
		};
	}, [reference]);

	return size;
}
