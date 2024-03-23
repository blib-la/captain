import type { MutableRefObject } from "react";
import { useState, useEffect, useCallback, useRef } from "react";

export interface UseScrollPositionHook {
	scrollable: boolean;
	start: boolean;
	end: boolean;
}

export function useScrollPosition(
	reference: MutableRefObject<HTMLElement | null | undefined>
): UseScrollPositionHook {
	const [scrollPosition, setScrollPosition] = useState<UseScrollPositionHook>({
		scrollable: false,
		start: true,
		end: false,
	});

	const observer = useRef<ResizeObserver>();

	const checkScroll = useCallback(() => {
		if (reference.current) {
			const { scrollWidth, clientWidth, scrollLeft } = reference.current;
			const isScrollable = scrollWidth > clientWidth;
			const isStart = scrollLeft === 0;
			const isEnd = scrollLeft === scrollWidth - clientWidth;

			setScrollPosition({
				scrollable: isScrollable,
				start: isStart,
				end: isEnd,
			});
		}
	}, [reference]);

	useEffect(() => {
		checkScroll();

		const currentReference = reference.current;
		if (currentReference) {
			currentReference.addEventListener("scroll", checkScroll, { passive: true });
		}

		observer.current = new ResizeObserver(checkScroll);

		if (currentReference) {
			observer.current.observe(currentReference);
		}

		return () => {
			if (currentReference) {
				currentReference.removeEventListener("scroll", checkScroll);
			}

			if (observer.current) {
				observer.current.disconnect();
			}
		};
	}, [reference, checkScroll]);

	return scrollPosition;
}
