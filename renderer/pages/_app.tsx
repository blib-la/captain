import CssBaseline from "@mui/joy/CssBaseline";
import { CssVarsProvider } from "@mui/joy/styles";
import dayjs from "dayjs";
import type { AppProps } from "next/app";
import dynamic from "next/dynamic";
import Head from "next/head";
import { useRouter } from "next/router";
import { appWithTranslation } from "next-i18next";
import { useMemo } from "react";
import { SWRConfig } from "swr";


import { globalStyles } from "@/ions/styles";
import { fetcher } from "@/ions/swr/fetcher";
import { theme } from "@/ions/theme";
import { CSS_VARIABLE_PREFIX } from "@/ions/theme/constants";

import "@/ions/date";



function App({
	Component,
	pageProps: { session, navigation, address, ...pageProperties },
}: AppProps) {
	const { locale, asPath } = useRouter();

	// Intended abuse of useMemo to allow changes on server and client mount
	useMemo(() => {
		// We need to set is before the render to tell dayjs to change the locale
		dayjs.locale(locale!);
	}, [locale]);

	return (
		<CssVarsProvider
			theme={theme}
			defaultMode="system"
			modeStorageKey={`${CSS_VARIABLE_PREFIX}-mode`}
		>
			<CssBaseline />
			{globalStyles}
			<Head>
				<title>Blibla</title>
				<meta
					name="viewport"
					content="width=device-width, initial-scale=1.0, viewport-fit=cover"
				/>
				<meta charSet="utf8" />
				<meta name="format-detection" content="telephone=no" />
			</Head>

					<SWRConfig
						value={{
							fetcher,
							errorRetryCount: 3,
							focusThrottleInterval: 5 * 1000,
							revalidateOnReconnect: false,
						}}
					>

								<Component {...pageProperties} />

					</SWRConfig>
		</CssVarsProvider>
	);
}

export default appWithTranslation(App);
