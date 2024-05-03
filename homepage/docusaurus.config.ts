import type * as Preset from "@docusaurus/preset-classic";
import type { Config } from "@docusaurus/types";
import { themes as prismThemes } from "prism-react-renderer";

const config: Config = {
	title: "Captain",
	tagline: "A platform that evolves to your needs and brings your ideas to life",
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
			disableSwitch: false,
			respectPrefersColorScheme: true,
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
					label: "Supporters",
					position: "left",
					to: "/supporters",
				},
				{
					label: "Marketplace",
					position: "left",
					to: "/marketplace",
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
						{
							label: "Source Code",
							href: "https://github.com/blib-la/captain",
						},
					],
				},
				{
					title: "Community",
					items: [
						{
							label: "Discord",
							href: "https://discord.com/invite/m3TBB9XEkb",
						},
						{
							label: "GitHub",
							href: "https://github.com/blib-la/captain",
						},
						{
							label: "Hugging Face",
							href: "https://huggingface.co/Blib-la",
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
							label: "About us",
							href: "https://blib.la/about",
						},
					],
				},
				{
					title: "Legal",
					items: [
						{
							label: "Imprint",
							href: "https://blib.la/legal/imprint",
						},
						{
							label: "Data Privacy",
							href: "https://blib.la/legal/data-privacy",
						},
					],
				},
			],
			copyright: `Copyright © ${new Date().getFullYear()} Blibla`,
		},
		prism: {
			theme: prismThemes.github,
			darkTheme: prismThemes.dracula,
		},
	} satisfies Preset.ThemeConfig,
};

export default config;
