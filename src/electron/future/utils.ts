import type { BrowserWindow } from "electron";
import { app } from "electron";

import i18next from "../../../next-i18next.config";

import { userStore } from "./stores";

import { isProduction } from "#/flags";

/**
 * Retrieves the most appropriate locale for the application based on user preference,
 * system setting, or i18next's default configuration.
 *
 * Priority:
 * 1. User-defined language stored in `userStore`.
 * 2. System's preferred language obtained via Electron's `app.getLocale()`.
 * 3. Default locale specified in i18next configuration.
 *
 * @returns {string} The determined locale string.
 */
export function getLocale() {
	let locale = userStore.get("language");
	const systemLocale = app.getLocale();
	const [simpleLocale] = systemLocale.split("-");
	if (i18next.i18n.locales.includes(simpleLocale)) {
		locale = simpleLocale;
	}

	return locale || i18next.i18n.defaultLocale;
}

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
	console.log({ locale });
	if (isProduction) {
		await window_.loadURL(`app://./${locale}/${pathname}`);
	} else {
		const port = process.argv[2];
		await window_.loadURL(`http://localhost:${port}/${locale}/${pathname}`);
	}
}
