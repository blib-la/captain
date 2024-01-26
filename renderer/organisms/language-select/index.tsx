import Option from "@mui/joy/Option";
import Select from "@mui/joy/Select";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import type { ReactElement } from "react";

import { FlagDe } from "@/atoms/flags/de";
import { FlagUs } from "@/atoms/flags/us";
import {
  StyledFlagWrapper,
  StyledValueWrapper,
} from "@/organisms/language-select/styled";
import { FlagIt } from "@/atoms/flags/it";
import { FlagEs } from "@/atoms/flags/es";
import { FlagFr } from "@/atoms/flags/fr";
import { FlagNl } from "@/atoms/flags/nl";
import { FlagZh } from "@/atoms/flags/zh";
import { FlagJa } from "@/atoms/flags/ja";
import { FlagRu } from "@/atoms/flags/ru";
import { FlagPt } from "@/atoms/flags/pt";
import { FlagPl } from "@/atoms/flags/pl";
import { FlagHe } from "@/atoms/flags/he";

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
  const { asPath, locale, locales = [], push } = useRouter();
  const { t } = useTranslation(["common"]);

  const localeRegex = new RegExp(`/(${locales.join("|")})$`);
  const asPath_ = asPath.replace(localeRegex, "/");
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
      renderValue={(option) => (
        <StyledValueWrapper>
          <StyledFlagWrapper>{localeFlags[option!.value]}</StyledFlagWrapper>
          {localeNames[option!.value]}
        </StyledValueWrapper>
      )}
      onChange={async (event, value: string | null) => {
        await push(asPath_, undefined, { locale: value! });
      }}
    >
      {locales.map((locale) => (
        <Option key={locale} value={locale}>
          <StyledFlagWrapper>{localeFlags[locale]}</StyledFlagWrapper>{" "}
          {localeNames[locale]}
        </Option>
      ))}
    </Select>
  );
}
