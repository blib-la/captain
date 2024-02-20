/** @type {import('next-i18next').UserConfig} */
module.exports = {
	i18n: {
		defaultLocale: "en",
		locales: [
			"de", // German
			"en", // English
			"es", // Spanish
			"fr", // French
			// "he", // Hebrew
			"it", // Italian
			"ja", // Japanese
			"nl", // Dutch
			"pl", // Polish
			"pt", // Portuguese
			"ru", // Russian
			"zh", // Chinese
		],
	},
	debug: process.env.NODE_ENV === "development",
	reloadOnPrerender: process.env.NODE_ENV === "development",
	localePath:
		typeof window === "undefined"
			? require("path").resolve("./src/client/public/locales")
			: "/locales",
};
