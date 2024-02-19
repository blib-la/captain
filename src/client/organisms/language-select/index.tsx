import Option from "@mui/joy/Option";
import Select from "@mui/joy/Select";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import type { ReactElement } from "react";

import index18Next from "../../../../next-i18next.config.js";

import { buildKey } from "#/build-key";
import { ID } from "#/enums";
import { FlagDe } from "@/atoms/flags/de";
import { FlagEs } from "@/atoms/flags/es";
import { FlagFr } from "@/atoms/flags/fr";
import { FlagHe } from "@/atoms/flags/he";
import { FlagIt } from "@/atoms/flags/it";
import { FlagJa } from "@/atoms/flags/ja";
import { FlagNl } from "@/atoms/flags/nl";
import { FlagPl } from "@/atoms/flags/pl";
import { FlagPt } from "@/atoms/flags/pt";
import { FlagRu } from "@/atoms/flags/ru";
import { FlagUs } from "@/atoms/flags/us";
import { FlagZh } from "@/atoms/flags/zh";
import { StyledFlagWrapper, StyledValueWrapper } from "@/organisms/language-select/styled";

export const localeNames: Record<string, string> = {
	de: "Deutsch",
	en: "English",
	es: "Español",
	fr: "Français",
	he: "עברית",
	it: "Italiano",
	ja: "日本語",
	nl: "Nederlands",
	pl: "Polski",
	pt: "Português",
	ru: "Русский",
	zh: "中文",
};
export const localeFlags: Record<string, ReactElement> = {
	de: <FlagDe />,
	en: <FlagUs />,
	es: <FlagEs />,
	fr: <FlagFr />,
	he: <FlagHe />,
	it: <FlagIt />,
	ja: <FlagJa />,
	nl: <FlagNl />,
	pl: <FlagPl />,
	pt: <FlagPt />,
	ru: <FlagRu />,
	zh: <FlagZh />,
};

export function LanguageSelect() {
	const { asPath = [], push } = useRouter();
	const {
		t,
		i18n: { language: locale },
	} = useTranslation(["common"]);
	const { locales } = index18Next.i18n;
	// Const locale = "en";
	const localeRegex = new RegExp(`/(${locales.join("|")})/`);
	const asPath_ = (asPath as string).replace(localeRegex, "/");

	return (
		<Select
			data-testid="language-selector"
			value={locale}
			name="language"
			variant="soft"
			color="neutral"
			component="label"
			sx={{ width: { xs: "100%" } }}
			aria-label={t("common:language")}
			slotProps={{
				listbox: {
					"data-testid": "language-selector-listbox",
				},
				button: {
					"data-testid": "language-selector-button",
					"aria-label": localeNames[locale!],
					sx: {
						lineHeight: "inherit",
					},
				},
			}}
			renderValue={option => (
				<StyledValueWrapper>
					<StyledFlagWrapper>{localeFlags[option!.value]}</StyledFlagWrapper>
					{localeNames[option!.value]}
				</StyledValueWrapper>
			)}
			onChange={async (event, value: string | null) => {
				await window.ipc.send(buildKey([ID.USER], { suffix: ":language" }), value);
				await push(`/${value}${asPath_}`, undefined);
			}}
		>
			{locales.map(locale => (
				<Option key={locale} value={locale}>
					<StyledFlagWrapper>{localeFlags[locale]}</StyledFlagWrapper>{" "}
					{localeNames[locale]}
				</Option>
			))}
		</Select>
	);
}
