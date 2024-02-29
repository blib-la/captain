import { CssVarsProvider } from "@mui/joy/styles";
import dayjs from "dayjs";
import type { AppProps } from "next/app";
import Head from "next/head";
import { appWithTranslation, useTranslation } from "next-i18next";
import { useEffect, useMemo } from "react";
import { SWRConfig } from "swr";

import { globalStyles } from "@/ions/styles";
import { fetcher } from "@/ions/swr/fetcher";
import { theme } from "@/ions/theme";
import { CSS_VARIABLE_PREFIX } from "@/ions/theme/constants";

import "@/ions/date";
import { css, Global } from "@emotion/react";
import CssBaseline from "@mui/joy/CssBaseline";

function App({ Component, pageProps }: AppProps) {
	const {
		i18n: { language },
	} = useTranslation();

	// Intended abuse of useMemo to allow changes on server and client mount
	useMemo(() => {
		// We need to set is before the render to tell dayjs to change the locale
		dayjs.locale(language!);
	}, [language]);

	useEffect(() => {
		document.documentElement.lang = language!;
	}, [language]);

	return (
		<CssVarsProvider
			theme={theme}
			defaultMode="system"
			modeStorageKey={`${CSS_VARIABLE_PREFIX}-mode`}
		>
			{globalStyles}
			<Head>
				<title>Blibla</title>
				<meta
					name="viewport"
					content="width=device-width, initial-scale=1.0, viewport-fit=cover"
				/>
				<meta charSet="utf8" />
				<meta name="format-detection" content="telephone=no" />
				<link rel="shortcut icon" type="image/png" href="/images/logo.png" />
			</Head>
			<SWRConfig
				value={{
					fetcher,
					errorRetryCount: 3,
					focusThrottleInterval: 5 * 1000,
					revalidateOnReconnect: true,
				}}
			>
				<Global
					styles={css({
						"*": { overflow: "hidden" },
						body: { margin: 0 },
					})}
				/>
				<CssBaseline />
				<Component {...pageProps} />
			</SWRConfig>
		</CssVarsProvider>
	);
}

export default appWithTranslation(App);
