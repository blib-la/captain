import { readFileSync } from "node:fs";
import path from "path";

import type { BrowserWindowConstructorOptions } from "electron";
import type electronServe from "electron-serve";
import serve from "electron-serve";
import { globbySync } from "globby";
import matter from "gray-matter";

import logger from "@/services/logger";
import { getCaptainApps } from "@/utils/path-helpers";

export const appLoaders: Record<string, electronServe.loadURL> = {};

export type MultiWindowKey = `${string}-window`;
export type MultiWindowConfiguration = Record<
	MultiWindowKey | "main-window",
	BrowserWindowConstructorOptions & { route?: string }
>;

/**
 * Determines if the given configuration object is meant for multi-window setups.
 * This is identified by checking for the presence of a specific key ("main-window") in the object,
 * which indicates a structured configuration for multiple windows.
 *
 * @param {BrowserWindowConstructorOptions | MultiWindowConfiguration} object_ - The configuration object
 *                                                                               to be tested. This object can be either
 *                                                                               a set of options for a single BrowserWindow
 *                                                                               or a configuration object defining multiple windows.
 * @returns {boolean} Returns true if the configuration is for multiple windows, otherwise false.
 */

export function isMultiWindow(
	object_: BrowserWindowConstructorOptions | MultiWindowConfiguration
): object_ is MultiWindowConfiguration {
	return Object.keys(object_).includes("main-window");
}

/**
 * Determines if the given configuration object is intended for a single-window setup.
 * This check is performed by verifying that none of the keys in the object end with "-window",
 * which would suggest a configuration for multiple distinct windows.
 *
 * @param {BrowserWindowConstructorOptions | MultiWindowConfiguration} object_ - The configuration object
 *                                                                               to be evaluated. This parameter
 *                                                                               can either be a straightforward
 *                                                                               BrowserWindow configuration or
 *                                                                               a multi-window setup object.
 * @returns {boolean} Returns true if the configuration only pertains to a single window, otherwise false.
 */

export function isSingleWindow(
	object_: BrowserWindowConstructorOptions | MultiWindowConfiguration
): object_ is BrowserWindowConstructorOptions {
	return !Object.keys(object_).some(key => key.endsWith("-window"));
}

/**
 * Registers each installed application by discovering markdown files named 'captain.md' in app directories.
 * This function reads each markdown file to extract front matter data which dictates whether an app requires a
 * single or multi-window setup. It then registers a custom protocol for each app, enabling the app to be served
 * statically.
 *
 * The function handles multi-window apps by creating specific configurations for each window mentioned in the
 * front matter and registering each with its custom protocol and path. For apps without multiple window configurations,
 * a single protocol is registered.
 *
 * Assumptions:
 * - Each app directory must contain a 'captain.md' file with YAML front matter that includes window configurations.
 * - Apps are located in a specific directory retrievable by `getCaptainApps()`.
 *
 * Side Effects:
 * - Global `appLoaders` object is populated with functions capable of serving the app files under specific protocols.
 *
 * @returns {void} Does not return a value but logs information about the discovered and registered applications.
 */

export function registerApps() {
	// Discover all installed apps based on the presence of an 'captain.md' in their respective directories.
	const installedApps = globbySync(["*/captain.md"], {
		cwd: getCaptainApps(),
	});
	logger.info({ installedApps });

	// Register a custom protocol for each installed app, allowing them to be served statically.
	for (const installedApp of installedApps) {
		const { dir } = path.parse(installedApp);
		const id = dir.split("/").pop()!;
		const markdownWithFrontmatter = readFileSync(getCaptainApps(installedApp), "utf8");
		const { data } = matter(markdownWithFrontmatter);
		if (data.parameters && isMultiWindow(data.parameters)) {
			const configurations: {
				id: string;
				options: BrowserWindowConstructorOptions & { route?: string };
			}[] = [];
			for (const key in data.parameters) {
				if (Object.hasOwn(data.parameters, key) && key.endsWith("-window")) {
					configurations.push({
						id: `${data.id}-${key}`,
						options: data.parameters[key as MultiWindowKey],
					});
				}
			}

			for (const configuration of configurations) {
				const subId = configuration.id;
				appLoaders[subId] = serve({
					// All windows must be hosted from the same directory
					directory: getCaptainApps(id),
					scheme: `captn-${subId}`,
					hostname: "localhost",
					file: configuration.options.route || "index",
				});
			}
		} else {
			appLoaders[id] = serve({
				directory: getCaptainApps(id),
				scheme: `captn-${id}`,
				hostname: "localhost",
				file: "index",
			});
		}
	}
}
