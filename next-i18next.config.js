/** @type {import('next-i18next').UserConfig} */
module.exports = {
  i18n: {
    defaultLocale: "en",
    locales: [
      "de", // German
      "en", // English
      "es", // Spanish
      "fr", // French
      "he", // Hebrew
      "it", // Italian
      "ja", // Japanese
      "nl", // Dutch
      "zh", // Chinese
      "ru", // Russian
      "pt", // Portuguese
      "pl", // Polish
    ],
  },
  debug: process.env.NODE_ENV === "development",
  reloadOnPrerender: process.env.NODE_ENV === "development",
  localePath:
    typeof window === "undefined"
      ? require("node:path").resolve("./renderer/public/locales")
      : "/locales",
};
