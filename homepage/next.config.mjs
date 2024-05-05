import createNextra from "nextra";

const withNextra = createNextra({
	theme: "nextra-theme-docs",
	themeConfig: "./theme.config.jsx",
});

/**
 *
 * @type {import('next').NextConfig} config
 */
const nextConfig = {
	webpack(config) {
		config.module.rules.push({
			test: /\.svg$/,
			use: ["@svgr/webpack"],
		});

		return config;
	},
};

export default withNextra(nextConfig);
