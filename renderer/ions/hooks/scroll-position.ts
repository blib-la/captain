import { useState, useEffect, useCallback, useRef, RefObject } from "react";

export interface UseScrollPositionHook {
  scrollable: boolean;
  start: boolean;
  end: boolean;
}

export function useScrollPosition(
  ref: RefObject<HTMLElement>,
): UseScrollPositionHook {
  const [scrollPosition, setScrollPosition] = useState<UseScrollPositionHook>({
    scrollable: false,
    start: true,
    end: false,
  });

  const observer = useRef<ResizeObserver>();

  const checkScroll = useCallback(() => {
    if (ref.current) {
      const { scrollWidth, clientWidth, scrollLeft } = ref.current;
      const isScrollable = scrollWidth > clientWidth;
      const isStart = scrollLeft === 0;
      const isEnd = scrollLeft === scrollWidth - clientWidth;

      setScrollPosition({
        scrollable: isScrollable,
        start: isStart,
        end: isEnd,
      });
    }
  }, [ref]);

  useEffect(() => {
    checkScroll(); // Initial check

    const currentRef = ref.current;
    if (currentRef) {
      currentRef.addEventListener("scroll", checkScroll, { passive: true });
    }

    observer.current = new ResizeObserver(checkScroll);

    if (currentRef) {
      observer.current.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        currentRef.removeEventListener("scroll", checkScroll);
      }
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [ref, checkScroll]);

  return scrollPosition;
}
