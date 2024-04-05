import { useCaptainAction } from "@captn/react/use-captain-action";
import { USER_LANGUAGE_KEY, USER_THEME_KEY } from "@captn/utils/constants";
import type { Mode } from "@mui/system/cssVars/useCurrentColorScheme";
import { useRouter } from "next/router";
import { useEffect } from "react";

import { useSsrColorScheme } from "@/ions/hooks/color-scheme";
import { useLocalizedPath } from "@/organisms/language-select";

export function ActionListeners() {
	const { changeLanguage } = useLocalizedPath();
	const { setMode } = useSsrColorScheme();
	const {
		query: { action },
	} = useRouter();
	useCaptainAction(action as string);

	useEffect(() => {
		const unsubscribeLanguage = window.ipc.on(USER_LANGUAGE_KEY, async (locale: string) => {
			await changeLanguage(locale);
		});
		const unsubscribeTheme = window.ipc.on(USER_THEME_KEY, (mode: Mode) => {
			setMode(mode);
		});

		return () => {
			unsubscribeLanguage();
			unsubscribeTheme();
		};
	}, [changeLanguage, setMode]);
	return null;
}
