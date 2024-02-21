import { act, fireEvent, render } from "@testing-library/react";
import React, { useRef } from "react";

import { useScrollPosition } from "../scroll-position"; // Adjust your import path
import "@testing-library/jest-dom";

class ResizeObserver {
	observe() {}
	unobserve() {}
	disconnect() {}
}

global.ResizeObserver = ResizeObserver;
// Test component that uses your hook
function TestComponent() {
	const reference = useRef<HTMLDivElement>(null);
	const scroll = useScrollPosition(reference);

	return (
		<div>
			<div
				ref={reference}
				data-testid="scrollable-div"
				style={{ overflow: "scroll", width: 100 }}
			>
				<div style={{ width: 300 }}>Scroll me</div>
			</div>
			<p data-testid="scrollable">{scroll.scrollable ? "true" : "false"}</p>
			<p data-testid="start">{scroll.start ? "true" : "false"}</p>
			<p data-testid="end">{scroll.end ? "true" : "false"}</p>
		</div>
	);
}

describe("useScrollPosition", () => {
	beforeEach(() => {
		// Mock properties before each test
		Object.defineProperty(HTMLElement.prototype, "scrollWidth", {
			configurable: true,
			value: 300,
		});
		Object.defineProperty(HTMLElement.prototype, "clientWidth", {
			configurable: true,
			value: 100,
		});
	});

	it("should correctly detect scroll positions", async () => {
		const { getByTestId } = render(<TestComponent />);

		expect(getByTestId("scrollable")).toHaveTextContent("true");
		expect(getByTestId("start")).toHaveTextContent("true");
		expect(getByTestId("end")).toHaveTextContent("false");
	});

	it("should update scroll position on scroll event", async () => {
		const { getByTestId } = render(<TestComponent />);
		const scrollableDiv = getByTestId("scrollable-div"); // Add this data-testid to your scrollable div

		// Check initial state
		expect(getByTestId("scrollable")).toHaveTextContent("true");
		expect(getByTestId("start")).toHaveTextContent("true");
		expect(getByTestId("end")).toHaveTextContent("false");

		// Simulate scrolling
		act(() => {
			// Manually set the scroll position
			scrollableDiv.scrollLeft = 150; // Halfway scrolled
			// Dispatch the scroll event on the scrollable div
			fireEvent.scroll(scrollableDiv);
		});

		// Check the updated state after scrolling
		expect(getByTestId("start")).toHaveTextContent("false");
		expect(getByTestId("end")).toHaveTextContent("false"); // Still not at the end
	});
});
