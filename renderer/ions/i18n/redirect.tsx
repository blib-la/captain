import { useRouter } from "next/router";
import { useEffect } from "react";

import i18next from "../../../next-i18next.config.js";
// Import languageDetector from "./language-detector";

export function useRedirect(to?: string) {
	const { replace, asPath, route } = useRouter();
	const to_ = to || asPath;

	// Language detection
	useEffect(() => {
		async function detectLanguage() {
			// Const detectedLocale = languageDetector.detect();
			const storedLocale = await window.ipc.getLocale();
			const appLocale: string = storedLocale || i18next.i18n.defaultLocale;
			if (to_.startsWith("/" + appLocale) && route === "/404") {
				// Prevent endless loop
				await replace("/" + appLocale + route);
				return;
			}

			/* If (languageDetector.cache) {
				languageDetector.cache(appLocale);
			} */

			await replace("/" + appLocale + to_);
		}

		detectLanguage();
	}, [replace, route, to_]);
}

export function Redirect({ to }: { to?: string }) {
	useRedirect(to);
	return null;
}
