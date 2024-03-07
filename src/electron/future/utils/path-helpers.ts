// Define a variable for the resources directory.
// If in development mode, it sets the resources directory relative to the current working directory.
// In production, it uses Electron's app.getPath to get the executable path and sets the resources directory
// accordingly.
import path from "path";

import { app } from "electron";

import { isDevelopment } from "#/flags";

export const resourcesDirectory = isDevelopment
	? path.join(process.cwd(), "resources")
	: path.join(app.getPath("exe"), "..", "resources", "app.asar.unpacked", "resources");

export const userDataDirectory = isDevelopment ? process.cwd() : app.getPath("userData");

/**
 * Combines the resources directory path with additional subpaths.
 * This utility function uses the Node.js path module's join method to construct a full path
 * by concatenating the resources directory path with any subpaths provided as arguments.
 *
 * @param {...string[]} subpath - One or more path segments to be joined with the resources directory.
 * @returns {string} The combined path formed by joining the resources directory with the provided subpaths.
 */
export function getDirectory(...subpath: string[]): string {
	return path.join(resourcesDirectory, ...subpath);
}

export function getUserData(...subpath: string[]): string {
	return path.join(userDataDirectory, ...subpath);
}

export function getCaptainData(...subpath: string[]): string {
	return getUserData("Captain_Data", ...subpath);
}

export function getCaptainDownloads(...subpath: string[]): string {
	return getCaptainData("downloads", ...subpath);
}

export function getCaptainTemporary(...subpath: string[]): string {
	return getCaptainData("temp", ...subpath);
}
