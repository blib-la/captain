import CssBaseline from "@mui/joy/CssBaseline";
import { CssVarsProvider } from "@mui/joy/styles";
import dayjs from "dayjs";
import type { AppProps } from "next/app";
import Head from "next/head";
import { useRouter } from "next/router";
import { appWithTranslation } from "next-i18next";
import { useMemo } from "react";
import { SWRConfig } from "swr";

import { globalStyles } from "@/ions/styles";
import { fetcher } from "@/ions/swr/fetcher";
import { theme } from "@/ions/theme";
import { CSS_VARIABLE_PREFIX } from "@/ions/theme/constants";
import { Layout } from "@/organisms/layout";

import "@/ions/date";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/dracula.css";
import "codemirror/theme/material-darker.css";
import "codemirror/theme/material.css";
import "codemirror/theme/zenburn.css";
import "codemirror/theme/monokai.css";

if (typeof window !== "undefined") {
	// TODO codemirror has a major change that definitely breaks this. For now let's keep it hacky.
	//  Not worth investigating ATM
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-expect-error
	import("codemirror/mode/markdown/markdown");
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-expect-error
	import("codemirror/mode/javascript/javascript");
}

function App({ Component, pageProps }: AppProps) {
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
				<link rel="shortcut icon" type="image/png" href="/images/logo.png" />
			</Head>
			<SWRConfig
				value={{
					fetcher,
					errorRetryCount: 3,
					focusThrottleInterval: 5 * 1000,
					revalidateOnReconnect: true,
					refreshInterval: 1000,
				}}
			>
				<Layout>
					<Component {...pageProps} />
				</Layout>
			</SWRConfig>
		</CssVarsProvider>
	);
}

export default appWithTranslation(App);
