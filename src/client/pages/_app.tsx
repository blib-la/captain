import { AppFrame } from "@captn/joy/app-frame";
import { globalStyles } from "@captn/joy/styles";
import { ThemeProvider } from "@captn/joy/theme";
import { TitleBar } from "@captn/joy/title-bar";
import { css, Global } from "@emotion/react";
import Box from "@mui/joy/Box";
import CssBaseline from "@mui/joy/CssBaseline";
import dayjs from "dayjs";
import type { AppProps } from "next/app";
import Head from "next/head";
import { useRouter } from "next/router";
import { appWithTranslation, useTranslation } from "next-i18next";
import type { ReactNode } from "react";
import { useEffect, useMemo } from "react";

import { useLocalizedPath } from "@/organisms/language-select";
import { TabButton } from "@/organisms/tab";

import "@/ions/date";

export function Layout({ children }: { children?: ReactNode }) {
	const { changeLanguage } = useLocalizedPath();

	useEffect(() => {
		const unsubscribe = window.ipc.on("language", locale => {
			changeLanguage(locale);
		});

		return () => {
			unsubscribe();
		};
	}, [changeLanguage]);

	return (
		<AppFrame
			titleBar={
				<TitleBar>
					<Box
						sx={{
							WebkitAppRegion: "no-drag",
							display: "flex",
							alignItems: "center",
							ml: -1,
						}}
					>
						<TabButton href="/core/dashboard">Dashboard</TabButton>
						<TabButton href="/core/settings">Settings</TabButton>
						<TabButton href="/core/help">Help</TabButton>
					</Box>
				</TitleBar>
			}
		>
			{children}
		</AppFrame>
	);
}

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
				<title>Blibla</title>
				<meta
					name="viewport"
					content="width=device-width, initial-scale=1.0, viewport-fit=cover"
				/>
				<meta charSet="utf8" />
				<meta name="format-detection" content="telephone=no" />
				<link rel="shortcut icon" type="image/png" href="/images/logo.png" />
			</Head>

			<CssBaseline />
			{isPrompt && (
				<Global
					styles={css({
						body: { background: "none", overflow: "hidden" },
					})}
				/>
			)}
			{isCore ? (
				<Layout>
					<Component {...pageProps} />
				</Layout>
			) : (
				<Component {...pageProps} />
			)}
		</ThemeProvider>
	);
}

export default appWithTranslation(App);
