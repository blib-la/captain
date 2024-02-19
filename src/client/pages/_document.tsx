import { getInitColorSchemeScript } from "@mui/joy/styles";
import Document, { Head, Html, Main, NextScript } from "next/document";

import { CSS_VARIABLE_PREFIX } from "@/ions/theme/constants";

export default class MyDocument extends Document {
	render() {
		return (
			<Html lang="en">
				<Head>
					{getInitColorSchemeScript({
						modeStorageKey: `${CSS_VARIABLE_PREFIX}-mode`,
					})}
				</Head>
				<body>
					<Main />
					<NextScript />
				</body>
			</Html>
		);
	}
}
