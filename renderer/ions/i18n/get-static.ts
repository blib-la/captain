import type { GetStaticPropsContext } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

import i18next from "../../../next-i18next.config.js";

export function getI18nPaths() {
	return i18next.i18n.locales.map(lng => ({
		params: {
			locale: lng,
		},
	}));
}

export function getStaticPaths() {
	return {
		fallback: false,
		paths: getI18nPaths(),
	};
}

export async function getI18nProperties(context: GetStaticPropsContext, namespaces = ["common"]) {
	const locale = context?.params?.locale as string;
	return {
		...(await serverSideTranslations(locale, namespaces)),
	};
}

export function makeStaticProperties(namespaces: string[] = []) {
	return async function (context: GetStaticPropsContext) {
		return {
			props: await getI18nProperties(context, namespaces),
		};
	};
}
