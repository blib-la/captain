import "@testing-library/jest-dom";

// Mock useRouter from Next.js
jest.mock("next/router", () => ({
	useRouter: jest.fn(),
}));

// Mock getActionArguments function
jest.mock("#/string", () => ({
	getActionArguments: jest.fn(),
}));

import { renderHook } from "@testing-library/react";
import { useRouter } from "next/router";

import { useCaptainAction } from "../vector-actions"; // Adjust the import path accordingly

import { getActionArguments } from "#/string";

// Setup useRouter mock to simulate query parameters
(useRouter as jest.Mock).mockReturnValue({
	query: { action: "focus:target-element" },
});

describe("useCaptainAction", () => {
	it("should focus the element with the specified data-captainid", () => {
		// Mock getActionArguments to return a focus action
		(getActionArguments as jest.Mock).mockReturnValue({
			command: "focus",
			captainId: "target-element",
			value: undefined,
		});

		// Setup a mock element in the document
		document.body.innerHTML = `<div data-captainid="target-element" tabindex="-1"></div>`;
		const targetElement = document.querySelector('[data-captainid="target-element"]');

		// Spy on the focus method
		const focusSpy = jest.spyOn(targetElement as HTMLElement, "focus");

		// Render the hook
		renderHook(() => useCaptainAction());

		// Assert focus was called
		expect(focusSpy).toHaveBeenCalled();

		// Cleanup
		focusSpy.mockRestore();
	});

	it("should click the element with the specified data-captainid", () => {
		// Mock getActionArguments to return a click action
		(getActionArguments as jest.Mock).mockReturnValue({
			command: "click",
			captainId: "clickable-element",
			value: undefined,
		});

		// Setup a mock element in the document
		document.body.innerHTML = `<button data-captainid="clickable-element"></button>`;
		const clickableElement = document.querySelector('[data-captainid="clickable-element"]');

		// Spy on the click method
		const clickSpy = jest.spyOn(clickableElement as HTMLElement, "click");

		// Render the hook
		renderHook(() => useCaptainAction());

		// Assert click was called
		expect(clickSpy).toHaveBeenCalled();

		// Cleanup
		clickSpy.mockRestore();
	});
	it("should type into the input element with the specified data-captainid", () => {
		// Mock getActionArguments to return a type action with a value
		(getActionArguments as jest.Mock).mockReturnValue({
			command: "type",
			captainId: "input-element",
			value: "Test typing",
		});

		// Setup a mock input element in the document
		document.body.innerHTML = `<input data-captainid="input-element" />`;
		const inputElement = document.querySelector('[data-captainid="input-element"]');

		// Render the hook
		renderHook(() => useCaptainAction());

		// Assert the input's value was set
		expect(inputElement).toHaveValue("Test typing");
	});
});
