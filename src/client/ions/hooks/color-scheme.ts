import { USER_THEME_KEY } from "@captn/utils/constants";
import { useColorScheme } from "@mui/joy/styles";
import type { Mode } from "@mui/system/cssVars/useCurrentColorScheme";
import { useCallback, useEffect, useState } from "react";

export function useSsrColorScheme() {
	const { mode, setMode } = useColorScheme();
	const [mode_, setMode_] = useState<Mode>("system");

	const setLazyMode = useCallback(
		(newMode: Mode) => {
			setMode(newMode);
		},
		[setMode]
	);
	useEffect(() => {
		setMode_(mode ?? "system");

		window.ipc.send(USER_THEME_KEY, mode ?? "system");
	}, [mode]);
	return { mode: mode_, setMode: setLazyMode };
}
