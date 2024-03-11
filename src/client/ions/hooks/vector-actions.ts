import { useRouter } from "next/router";
import { useEffect } from "react";

import { getActionArguments } from "#/string";
import { performElementAction } from "@/ions/handlers/action";

/**
 * A custom React hook that uses URL query parameters to perform specified actions on elements identified by their `data-captainid`.
 *
 * The hook listens for changes in the URL's `action` query parameter and parses its value to execute supported commands:
 * - "focus": Sets focus on the targeted element.
 * - "click": Triggers a click event on the targeted element.
 * - "type": Sets the value of an input element and dispatches an input event to simulate typing.
 *
 * This hook is intended for use in Next.js applications to dynamically handle UI interactions based on URL state,
 * enhancing user experience by enabling direct interaction triggers via URL navigation.
 *
 * @example
 * // Assuming a component within a Next.js application:
 * useCaptainAction();
 * // Given a URL like: /page?action=click:data-captainid-123
 * // Automatically clicks the element with `data-captainid="data-captainid-123"`
 */
export function useCaptainAction() {
	const {
		query: { action },
	} = useRouter();

	useEffect(() => {
		if (typeof action === "string") {
			const { command, captainId, value } = getActionArguments(action);

			if (!captainId) {
				return;
			} // Early return if captainId is missing

			switch (command) {
				case "focus": {
					performElementAction(captainId, element => {
						element.focus();
					});
					break;
				}

				case "click": {
					performElementAction(captainId, element => {
						element.click();
					});
					break;
				}

				case "type": {
					if (value !== undefined) {
						performElementAction(captainId, element => {
							if ("value" in element) {
								(element as HTMLInputElement).value = value; // Assuming el can be cast to HTMLInputElement
								element.dispatchEvent(new Event("input", { bubbles: true })); // Trigger input event
							}
						});
					}

					break;
				}

				default: {
					// Handle unsupported commands or log an informative message
					console.warn(`Unsupported command: ${command}`);
					break;
				}
			}
		}
	}, [action]);
}
