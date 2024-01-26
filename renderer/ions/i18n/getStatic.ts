import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import i18nextConfig from "../../next-i18next.config";
import { GetStaticPropsContext } from "next";

export const getI18nPaths = () =>
  i18nextConfig.i18n.locales.map((lng) => ({
    params: {
      locale: lng,
    },
  }));

export const getStaticPaths = () => ({
  fallback: false,
  paths: getI18nPaths(),
});

export async function getI18nProps(
  context: GetStaticPropsContext,
  namespaces = ["common"],
) {
  const locale = context?.params?.locale as string;
  return {
    ...(await serverSideTranslations(locale, namespaces)),
  };
}

export function makeStaticProps(namespaces: string[] = []) {
  return async function getStaticProps(context: GetStaticPropsContext) {
    return {
      props: await getI18nProps(context, namespaces),
    };
  };
}
