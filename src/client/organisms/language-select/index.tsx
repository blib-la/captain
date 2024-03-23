import List from "@mui/joy/List";
import ListItem from "@mui/joy/ListItem";
import ListItemButton from "@mui/joy/ListItemButton";
import ListItemContent from "@mui/joy/ListItemContent";
import ListItemDecorator from "@mui/joy/ListItemDecorator";
import Option from "@mui/joy/Option";
import Select from "@mui/joy/Select";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import type { ReactElement } from "react";
import { useCallback } from "react";

import nexti18Next from "../../../../next-i18next.config.js";

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
	en: "English (US)",
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

export function useLocalizedPath() {
	const { asPath, push } = useRouter();
	const {
		i18n: { language: locale },
	} = useTranslation();
	const { locales, defaultLocale } = nexti18Next.i18n;
	const localeRegex = new RegExp(`/(${locales.join("|")})/`);
	const asPath_ = asPath.replace(localeRegex, "/");
	return {
		locale,
		locales,
		defaultLocale,
		changeLanguage: useCallback(
			(locale_: string) => push(`/${locale_}${asPath_}`, undefined),
			[asPath_, push]
		),
	};
}

export function LanguageSelect() {
	const { t } = useTranslation(["common"]);
	const { changeLanguage, locale, locales } = useLocalizedPath();

	return (
		<Select
			data-testid="language-selector"
			data-captainid="language-settings"
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
				if (value) {
					await window.ipc.send(buildKey([ID.USER], { suffix: ":language" }), value);
					await changeLanguage(value);
				}
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

export function LanguageSelectList() {
	const { asPath = [], push } = useRouter();
	const {
		i18n: { language: locale },
	} = useTranslation(["common"]);
	const { locales } = nexti18Next.i18n;
	const localeRegex = new RegExp(`/(${locales.join("|")})/`);
	const asPath_ = (asPath as string).replace(localeRegex, "/");

	return (
		<List data-testid="language-selector-list" variant="soft" color="neutral">
			{locales.map(locale_ => (
				<ListItem key={locale_} value={locale_}>
					<ListItemButton
						selected={locale === locale_}
						color="primary"
						onClick={async () => {
							await window.ipc.send(
								buildKey([ID.USER], { suffix: ":language" }),
								locale_
							);
							await push(`/${locale_}${asPath_}`, undefined);
						}}
					>
						<ListItemDecorator>
							<StyledFlagWrapper>{localeFlags[locale_]}</StyledFlagWrapper>
						</ListItemDecorator>
						<ListItemContent>{localeNames[locale_]}</ListItemContent>
					</ListItemButton>
				</ListItem>
			))}
		</List>
	);
}
