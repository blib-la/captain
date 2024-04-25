import type { BrowserWindow } from "electron";

import { isProduction } from "#/flags";
import logger from "@/services/logger";
import { getLocale } from "@/utils/locale";

/**
 * Loads a URL into the given BrowserWindow instance, adjusting the URL path
 * to include the appropriate locale prefix. This function supports both development
 * and production environments, altering the base URL accordingly.
 *
 * In production, it uses the `app://` protocol, whereas in development, it connects
 * to a localhost server at a port specified by the second command-line argument.
 *
 * @param {BrowserWindow} window_ - The BrowserWindow instance to load the URL into.
 * @param {string} pathname - The path to be loaded, appended after the locale prefix.
 */
export async function loadURL(window_: BrowserWindow, pathname: string) {
	const locale = getLocale();

	try {
		if (isProduction) {
			await window_.loadURL(`app://./${locale}/${pathname}`);
		} else {
			const port = process.argv[2];
			await window_.loadURL(`http://localhost:${port}/${locale}/${pathname}`);
		}
	} catch (error) {
		logger.error(`loadURL(): ${error}`);
	}
}
