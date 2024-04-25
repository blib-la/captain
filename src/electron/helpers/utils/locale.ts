import { app } from "electron";

import i18next from "../../../../next-i18next.config";

import { userStore } from "@/stores";

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
export function getLocale(): string {
	let locale = userStore.get("language");
	if (locale) {
		return locale;
	}

	const systemLocale = app.getLocale();
	const [simpleLocale] = systemLocale.split("-");
	if (i18next.i18n.locales.includes(simpleLocale)) {
		locale = simpleLocale;
	}

	return locale || i18next.i18n.defaultLocale;
}
