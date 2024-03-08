import { fireEvent, waitFor } from "@testing-library/react";
import { renderHook, act } from "@testing-library/react";
import { Provider } from "jotai";

import { useKeyboardControlledImagesNavigation } from "../keyboard-controlled-images-navigation";

describe("useKeyboardControlledImagesNavigation", () => {
	it("should handle keyboard navigation correctly", async () => {
		const onBeforeChangeMock = jest.fn();
		// Render the hook that we are testing
		renderHook(
			() => useKeyboardControlledImagesNavigation({ onBeforeChange: onBeforeChangeMock }),
			{
				wrapper: Provider,
			}
		);

		// Set initial state for images and selectedImage
		act(() => {
			fireEvent.keyDown(window, { key: "ArrowRight", altKey: true });
		});

		// Assertions
		await waitFor(() => {
			expect(onBeforeChangeMock).toHaveBeenCalledTimes(1);
		});
		act(() => {
			fireEvent.keyDown(window, { key: "ArrowLeft", altKey: true });
		});

		// Assertions
		await waitFor(() => {
			expect(onBeforeChangeMock).toHaveBeenCalledTimes(2);
		});
		act(() => {
			fireEvent.keyDown(window, { key: "ArrowUp", altKey: true });
		});

		// Assertions
		await waitFor(() => {
			expect(onBeforeChangeMock).toHaveBeenCalledTimes(3);
		});
		act(() => {
			fireEvent.keyDown(window, { key: "ArrowDown", altKey: true });
		});

		// Assertions
		await waitFor(() => {
			expect(onBeforeChangeMock).toHaveBeenCalledTimes(4);
		});
	});
	it("should not respond with alt key", async () => {
		const onBeforeChangeMock = jest.fn();

		// Render the hook that we are testing
		renderHook(
			() => useKeyboardControlledImagesNavigation({ onBeforeChange: onBeforeChangeMock }),
			{
				wrapper: Provider,
			}
		);

		// Set initial state for images and selectedImage
		act(() => {
			fireEvent.keyDown(window, { key: "ArrowRight" });
		});

		// Assertions
		await waitFor(() => {
			expect(onBeforeChangeMock).not.toHaveBeenCalled();
		});
	});
	it("should not respond to other keys", async () => {
		const onBeforeChangeMock = jest.fn();

		// Render the hook that we are testing
		renderHook(
			() => useKeyboardControlledImagesNavigation({ onBeforeChange: onBeforeChangeMock }),
			{
				wrapper: Provider,
			}
		);

		// Set initial state for images and selectedImage
		act(() => {
			fireEvent.keyDown(window, { key: "Enter", altKey: true });
		});

		// Assertions
		await waitFor(() => {
			expect(onBeforeChangeMock).not.toHaveBeenCalled();
		});
	});
});
