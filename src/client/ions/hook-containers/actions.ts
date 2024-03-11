import { useLocalizedPath } from "@/organisms/language-select";
import { useSsrColorScheme } from "@/ions/hooks/color-scheme";
import { useCaptainAction } from "@/ions/hooks/vector-actions";
import { useEffect } from "react";
import type { Mode } from "@mui/system/cssVars/useCurrentColorScheme";

export function ActionListeners() {
	const { changeLanguage } = useLocalizedPath();
	const { setMode } = useSsrColorScheme();

	useCaptainAction();

	useEffect(() => {
		const unsubscribeLanguage = window.ipc.on("language", async (locale: string) => {
			await changeLanguage(locale);
		});
		const unsubscribeTheme = window.ipc.on("theme", (mode: Mode) => {
			setMode(mode);
		});

		return () => {
			unsubscribeLanguage();
			unsubscribeTheme();
		};
	}, [changeLanguage, setMode]);
	return null;
}
