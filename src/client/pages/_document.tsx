import { CSS_VARIABLE_PREFIX } from "@captn/joy/theme";
import { getInitColorSchemeScript } from "@mui/joy/styles";
import type { DocumentContext } from "next/document";
import Document, { Head, Html, Main, NextScript } from "next/document";

export default class MyDocument extends Document {
	public static async getInitialProps(context: DocumentContext) {
		const initialProperties = await Document.getInitialProps(context);
		const additionalProperties = {
			locale: context.query.locale as string,
		};
		return {
			...initialProperties,
			...additionalProperties,
		};
	}

	render() {
		return (
			<Html lang={this.props.locale}>
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
