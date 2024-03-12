import { buildKey } from "#/build-key";
import { ID } from "#/enums";
import type { VectorStoreResponse } from "#/types/vector-store";

/**
 * Processes an action based on the provided vector store response. The function distinguishes between
 * "function" actions, which trigger specific functionalities, and other types of actions, such as opening an app.
 *
 * @param {VectorStoreResponse} response - The response object from the vector store, containing the payload
 * with details about the action to be performed.
 *
 * If the action is of type "function", it sends a message via the `window.ipc.send` method with a key built
 * from the `CAPTAIN_ACTION` ID and includes the entire payload in the message.
 *
 * For other types of actions, it constructs a key using the `APP` ID with an optional ":open" suffix
 * and sends a message with the `appId` and action type, derived from the response payload.
 *
 * This allows for dynamic handling of actions within the application, facilitating communication
 * with different parts of the system or triggering specific operations based on the vector store response.
 */
export function handleCaptainAction(response: VectorStoreResponse) {
	if (response.payload.action === "function") {
		window.ipc.send(buildKey([ID.CAPTAIN_ACTION]), {
			action: response.payload.action,
			payload: response.payload,
		});
	} else {
		window.ipc.send(buildKey([ID.APP], { suffix: ":open" }), {
			appId: response.payload.id,
			action: response.payload.action,
		});
	}
}

/**
 * Executes a specified action on an HTML element identified by its `data-captainid` attribute.
 *
 * This function aims to abstract the common pattern of querying an element by its `data-captainid`
 * and then performing some action on that element. It uses `CSS.escape` to ensure that the captainId
 * is safely used in a query selector, protecting against CSS injection vulnerabilities and syntax errors
 * due to special characters.
 *
 * @param {string} captainId - The unique identifier associated with the element's `data-captainid` attribute.
 * @param {(element: HTMLElement) => void} action - A callback function that performs an operation on the found element.
 * The action is only executed if the element is successfully queried from the DOM.
 *
 * @example
 * // Focuses an element with `data-captainid="username-input"`
 * performElementAction("username-input", (el) => el.focus());
 *
 * @example
 * // Clicks a button with `data-captainid="submit-button"`
 * performElementAction("submit-button", (el) => el.click());
 *
 * @throws {Error} Logs an error to the console if the element cannot be found or if the action throws an error.
 */
export function performElementAction(captainId: string, action: (element: HTMLElement) => void) {
	try {
		const selector = `[data-captainid="${CSS.escape(captainId)}"]`;
		const element = document.querySelector<HTMLElement>(selector);
		if (element) {
			action(element);
		}
	} catch (error) {
		console.error(`Error performing action on element with captainId=${captainId}:`, error);
	}
}
