const path = require("path");

const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");
const cwd = process.cwd();

console.log({ cwd });

module.exports = {
	mainSrcDir: "src/electron",
	rendererSrcDir: "src/client",
	webpack(config) {
		config.resolve.plugins = [
			new TsconfigPathsPlugin({ configFile: path.join(cwd, "tsconfig.json") }),
		];
		config.entry = {
			background: "./src/electron/background.ts",
			preload: "./src/electron/preload.ts",
		};
		return config;
	},
};
