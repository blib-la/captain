/** @type {import('next-i18next').UserConfig} */
module.exports = {
	i18n: {
		defaultLocale: "en",
		locales: ["en", "de"],
	},
	localePath:
		typeof window === "undefined"
			? require("node:path").resolve("./public/locales")
			: "/locales",
};
