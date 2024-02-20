import Link from "next/link";
import { useTranslation } from "next-i18next";
import type { ReactNode } from "react";

export function I18nLink({ children, href }: { href: string; children: ReactNode }) {
	const {
		i18n: { language: locale },
	} = useTranslation();
	const href_ = `/${locale}${href}`;

	return (
		<Link passHref legacyBehavior href={href_}>
			{children}
		</Link>
	);
}
