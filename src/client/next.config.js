const path = require("path");

const transpileModules = require("next-transpile-modules");

const withTM = transpileModules([
	"@mui/joy",
	"@captn/joy",
	"@captn/react",
	"@captn/utils",
	"@captn/theme",
]); // Pass the modules you would like to see transpiled

const cwd = process.cwd();
const folderPaths = [path.resolve(cwd, "src/shared")];
const rules = [
	{
		test: /\.ts$/,
		exclude: /^node_modules/,
		loader: "ts-loader",
		include: [folderPaths],
		options: {
			transpileOnly: true,
		},
	},
];

/**
 *
 * @type {import('next').NextConfig} config
 */
const nextConfig = {
	trailingSlash: true,
	images: {
		unoptimized: true,
	},
	modularizeImports: {
		"@mui/icons-material": {
			transform: "@mui/icons-material/{{member}}",
		},
	},
	webpack(config, { isServer }) {
		config.module.rules = [...config.module.rules, ...rules];
		config.resolve.extensions = [...config.resolve.extensions, ".ts", ".tsx"];
		return config;
	},
};
/**
 *
 * @param plugins
 * @param {import('next').NextConfig} nextConfig
 * @returns {import('next').NextConfigObject}
 */

module.exports = withTM(nextConfig);
