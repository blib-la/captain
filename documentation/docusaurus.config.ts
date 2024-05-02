import type * as Preset from "@docusaurus/preset-classic";
import type { Config } from "@docusaurus/types";
import { themes as prismThemes } from "prism-react-renderer";

const config: Config = {
	title: "Captain",
	tagline: "Your AI Hub, on your computer",
	favicon: "img/favicon.ico",

	// Set the production url of your site here
	url: "https://get-captain.com",
	// Set the /<baseUrl>/ pathname under which your site is served
	// For GitHub pages deployment, it is often '/<projectName>/'
	baseUrl: "/",

	// GitHub pages deployment config.
	// If you aren't using GitHub pages, you don't need these.
	organizationName: "blib-la", // Usually your GitHub org/user name.
	projectName: "captain", // Usually your repo name.

	onBrokenLinks: "throw",
	onBrokenMarkdownLinks: "warn",

	// Even if you don't use internationalization, you can use this field to set
	// useful metadata like html lang. For example, if your site is Chinese, you
	// may want to replace "en" with "zh-Hans".
	i18n: {
		defaultLocale: "en",
		locales: ["en"],
	},

	presets: [
		[
			"classic",
			{
				docs: {
					sidebarPath: "./sidebars.ts",
				},
				theme: {
					customCss: "./src/css/custom.css",
				},
			} satisfies Preset.Options,
		],
		[
			"docusaurus-plugin-typedoc",
			{
				tsconfig: "../tsconfig.json",
				entryPoints: ["../src"],
				sidebar: {
					fullNames: false, // Ensures only short names are used in the sidebar
				},
			},
		],
	],

	themeConfig: {
		// Replace with your project's social card
		colorMode: {
			defaultMode: "light",
			disableSwitch: true,
			respectPrefersColorScheme: false,
		},
		image: "img/captain-social-card.jpg",
		navbar: {
			title: "Captain",
			logo: {
				alt: "Captain",
				src: "img/captain.svg",
			},
			items: [
				{
					type: "docSidebar",
					sidebarId: "apiSidebar",
					position: "left",
					label: "API",
				},
				{
					href: "https://github.com/blib-la/captain",
					label: "GitHub",
					position: "right",
				},
			],
		},
		footer: {
			style: "light",
			links: [
				{
					title: "Docs",
					items: [
						{
							label: "API",
							to: "/docs/api/",
						},
					],
				},
				{
					title: "Community",
					items: [
						{
							label: "GitHub",
							href: "https://github.com/blib-la/captain",
						},
						{
							label: "Discord",
							href: "https://discord.com/invite/m3TBB9XEkb",
						},
						{
							label: "X (Twitter)",
							href: "https://twitter.com/blib_la",
						},
					],
				},
				{
					title: "More",
					items: [
						{
							label: "Blog",
							href: "https://blib.la/blog",
						},
						{
							label: "Blibla",
							href: "https://blib.la/",
						},
					],
				},
			],
			copyright: `Copyright © ${new Date().getFullYear()} Blibla.`,
		},
		prism: {
			theme: prismThemes.github,
			darkTheme: prismThemes.dracula,
		},
	} satisfies Preset.ThemeConfig,
};

export default config;
