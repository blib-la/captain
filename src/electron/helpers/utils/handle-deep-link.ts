import { keyStore } from "@/electron/stores";

/**
 * Handles a deep link URL by parsing it to extract the `access_token` parameter.
 * The function logs the access token and saves it to a key store.
 *
 * @param {string} url - The URL received from the custom protocol handler.
 *                       This URL is expected to contain an `access_token` parameter.
 *
 * The function extracts the `access_token` from the URL's search parameters, logs it to the console,
 * and then stores it using the `keyStore` service under the key `captainCloud.accessToken`.
 * If the URL does not include an `access_token` or if it's null, the keyStore will be updated with a null value.
 *
 * @example
 * handleDeepLink("captain-login://open?access_token=xyz123");
 */
export function handleDeepLink(url: string) {
	const parsedUrl = new URL(url);
	const accessToken = parsedUrl.searchParams.get("access_token");
	if (accessToken) {
		keyStore.set("captainCloud.accessToken", accessToken);
	}
}
