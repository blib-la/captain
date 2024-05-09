import type { AppProps } from "next/app";
import Head from "next/head";

import "../globals.css";

export default function MyApp({ Component, pageProps }: AppProps) {
	return (
		<>
			<Head>
				<meta
					name="google-site-verification"
					content="wk67A6Fw4gEzlO6ADeOLfRwrDQF-9_Swb0P3fH1MqUA"
				/>
			</Head>
			<Component {...pageProps} />
		</>
	);
}
