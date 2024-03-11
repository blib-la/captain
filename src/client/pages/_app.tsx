import { globalStyles } from "@captn/joy/styles";
import { ThemeProvider } from "@captn/joy/theme";
import { css, Global } from "@emotion/react";
import CssBaseline from "@mui/joy/CssBaseline";
import dayjs from "dayjs";
import type { AppProps } from "next/app";
import Head from "next/head";
import { useRouter } from "next/router";
import { appWithTranslation, useTranslation } from "next-i18next";
import { useEffect, useMemo } from "react";

import { ActionListeners } from "@/ions/hook-containers/actions";
import { CoreLayout } from "@/organisms/layout/core";
import "@/ions/date";

function App({ Component, pageProps }: AppProps) {
	const {
		i18n: { language },
	} = useTranslation();
	const { pathname } = useRouter();

	const isPrompt = pathname === "/[locale]/prompt";
	const isCore = pathname.startsWith("/[locale]/core");
	// Intended abuse of useMemo to allow changes on server and client mount
	useMemo(() => {
		// We need to set is before the render to tell dayjs to change the locale
		dayjs.locale(language!);
	}, [language]);

	useEffect(() => {
		document.documentElement.lang = language!;
	}, [language]);

	return (
		<ThemeProvider>
			{globalStyles}
			<Head>
				<title>Captain</title>
				<meta
					name="viewport"
					content="width=device-width, initial-scale=1.0, viewport-fit=cover"
				/>
				<meta charSet="utf8" />
				<meta name="format-detection" content="telephone=no" />
				<link rel="shortcut icon" type="image/png" href="/images/logo.png" />
			</Head>

			<CssBaseline />
			<ActionListeners />
			{isPrompt && (
				<Global
					styles={css({
						body: { background: "none", overflow: "hidden" },
					})}
				/>
			)}
			{isCore ? (
				<CoreLayout>
					<Component {...pageProps} />
				</CoreLayout>
			) : (
				<Component {...pageProps} />
			)}
		</ThemeProvider>
	);
}

export default appWithTranslation(App);
