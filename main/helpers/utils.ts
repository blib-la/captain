import { exec } from "child_process";
import fs from "fs";
import fsp from "fs/promises";
import path from "path";
// eslint-disable-next-line unicorn/import-style
import util from "util";

import type { BrowserWindow, Rectangle } from "electron";
import { app, screen, shell } from "electron";
import JSON5 from "json5";
import sharp from "sharp";

import { MARKETPLACE_INDEX, MARKETPLACE_INDEX_DATA, MINIFIED_IMAGE_SIZE } from "./constants";
import { createJsonStructure } from "./read-index";
import { store as userStore } from "./store";

interface OpenNewGitHubIssueOptions {
	repoUrl?: string;
	user?: string;
	repo?: string;

	body?: string;
	title?: string;
	labels?: string[];
	template?: string;
	milestone?: string;
	assignee?: string;
	projects?: string[];
}
function newGithubIssueUrl(options: { repoUrl?: string; user?: string; repo?: string } = {}) {
	let repoUrl;
	if (options.repoUrl) {
		repoUrl = options.repoUrl;
	} else if (options.user && options.repo) {
		repoUrl = `https://github.com/${options.user}/${options.repo}`;
	} else {
		throw new Error(
			"You need to specify either the `repoUrl` option or both the `user` and `repo` options"
		);
	}

	const url = new URL(`${repoUrl}/issues/new`);

	const types = ["body", "title", "labels", "template", "milestone", "assignee", "projects"];

	for (const type of types) {
		let value = options[type as keyof typeof options];
		if (value === undefined) {
			continue;
		}

		if (type === "labels" || type === "projects") {
			if (!Array.isArray(value)) {
				throw new TypeError(`The \`${type}\` option should be an array`);
			}

			value = value.join(",");
		}

		url.searchParams.set(type, value);
	}

	return url.toString();
}

/**
 Opens the new issue view on the given GitHub repo in the browser.
 Optionally, with some fields like title and body prefilled.

 @param options - The options are passed to the [`new-github-issue-url`](https://github.com/sindresorhus/new-github-issue-url#options) package.

 @example
 ```
 import {openNewGitHubIssue} from 'electron-util';

 openNewGitHubIssue({
 user: 'sindresorhus',
 repo: 'playground',
 body: 'Hello'
 });
 */
export async function openNewGitHubIssue(options: OpenNewGitHubIssueOptions) {
	const url = newGithubIssueUrl(options);
	await shell.openExternal(url);
}

// Check if the app is running in development mode.
// This is typically set using the NODE_ENV environment variable.
const isDevelopment = process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test";

// Define a variable for the resources directory.
// If in development mode, it sets the resources directory relative to the current working directory.
// In production, it uses Electron's app.getPath to get the executable path and sets the resources directory
// accordingly.
export const resourcesDirectory = isDevelopment
	? path.join(process.cwd(), "resources")
	: path.join(app.getPath("exe"), "..", "resources", "app.asar.unpacked", "resources");

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
	return path.join(app.getPath("userData"), ...subpath);
}

export const captainDataPath = getUserData("Captain_Data");

/**
 * Synchronously get a list of image files from a directory.
 * @param {string} directoryPath - The path of the directory to scan.
 * @returns {string[]} An array of filenames that match the specified extension.
 */
export function getImageFiles(directoryPath: string) {
	return fs.readdirSync(directoryPath).filter(file => /\.(jpg|jpeg|png)$/i.exec(file));
}

/**
 * Asynchronously create a minified version of an image.
 * @param {string} filePath - The path to the original image file.
 * @param {string} outputPath - The path to output the minified image.
 * @param {object} sizeOptions - Object containing width and height properties.
 * @returns {Promise<string>} A promise that resolves to the path of the minified image.
 */
export async function createMinifiedImageCache(
	filePath: string,
	outputPath: string,
	{
		width = MINIFIED_IMAGE_SIZE,
		height = MINIFIED_IMAGE_SIZE,
	}: { height?: number; width?: number } = {}
): Promise<string> {
	try {
		// Use sharp to resize the image to the specified width and height.
		await sharp(filePath)
			.resize(width, height, {
				fit: sharp.fit.outside,
				withoutEnlargement: true,
			})
			.toFile(outputPath);
	} catch (error) {
		console.error(error);
	}

	// Return the output path of the minified image.
	return outputPath;
}

export function parseJsonFromString(inputString: string) {
	// Regular expression to match code blocks with or without language specifier
	const codeBlockRegex = /^```\w*\n?([\S\s]*?)```$/;

	// Check for and remove code blocks if they exist
	const match = inputString.match(codeBlockRegex);
	if (match) {
		inputString = match[1];
	}

	// Trim any leading or trailing whitespace
	inputString = inputString.trim();

	// Parse and return the JSON
	try {
		return JSON5.parse(inputString);
	} catch (error) {
		console.error("Error parsing JSON:", error);
		return null;
	}
}

/**
 * Retrieves the current position and size of the given BrowserWindow.
 *
 * @param {BrowserWindow} win - The Electron BrowserWindow instance.
 * @returns {Rectangle} An object containing x and y coordinates, and width and height of the window.
 */
export function getCurrentPosition(win: BrowserWindow) {
	const position = win.getPosition();
	const size = win.getSize();
	return {
		x: position[0],
		y: position[1],
		width: size[0],
		height: size[1],
	};
}

/**
 * Checks if a window's state is within the specified bounds.
 *
 * @param {Rectangle} windowState - The state of the window, including position and size.
 * @param {Rectangle} bounds - The bounding rectangle to compare against.
 * @returns {boolean} Returns true if the window's state is within the bounds, otherwise false.
 */
export function windowWithinBounds(windowState: Rectangle, bounds: Rectangle) {
	return (
		windowState.x >= bounds.x &&
		windowState.y >= bounds.y &&
		windowState.x + windowState.width <= bounds.x + bounds.width &&
		windowState.y + windowState.height <= bounds.y + bounds.height
	);
}

/**
 * Resets the window size to default values and centers it on the primary display.
 *
 * @param {{ width: number; height: number }} defaultSize - The default width and height for the window.
 * @returns {Rectangle} The new window state with default size and centered position.
 */
export function resetToDefaults(defaultSize: { width: number; height: number }) {
	const { bounds } = screen.getPrimaryDisplay();
	return {
		...defaultSize,
		x: (bounds.width - defaultSize.width) / 2,
		y: (bounds.height - defaultSize.height) / 2,
	};
}

/**
 * Ensures that the window is visible on at least one display.
 * If the window is not visible, resets it to default size and position.
 *
 * @param {Rectangle} windowState - The current state of the window.
 * @param {{ width: number; height: number }} defaultSize - The default size of the window.
 * @returns {Rectangle} The adjusted window state, ensuring it's visible on a display.
 */
export function ensureVisibleOnSomeDisplay(
	windowState: Rectangle,
	defaultSize: { width: number; height: number }
) {
	const visible = screen
		.getAllDisplays()
		.some(display => windowWithinBounds(windowState, display.bounds));
	if (!visible) {
		// If the window is not visible on any display, reset it to default size and center it.
		return resetToDefaults(defaultSize);
	}

	// If the window is visible, return the current state.
	return windowState;
}

export const execAsync = util.promisify(exec);
export const isProduction = process.env.NODE_ENV === "production";
export const protocolName = "my";

export async function removeCaptainData(path_: string) {
	const directoryPath = path.join(captainDataPath, path_);

	try {
		await fsp.rm(directoryPath, { recursive: true });
	} catch (error) {
		console.error("Error removing directory:", error);
	}
}

export async function createMarketplace(gitRepository?: string) {
	const marketplaceIndex =
		gitRepository ||
		(userStore.get(MARKETPLACE_INDEX) as string) ||
		"git@github.com:blib-la/captain-marketplace.git";

	userStore.set(MARKETPLACE_INDEX, marketplaceIndex);

	try {
		await removeCaptainData("marketplace-index");
		await fsp.mkdir(captainDataPath, { recursive: true });
		await execAsync(`cd ${captainDataPath} && git clone ${marketplaceIndex} marketplace-index`);
	} catch (error) {
		console.error("Error executing command:", error);
	}

	const basePath = path.join(captainDataPath, "marketplace-index", "files");

	try {
		const jsonStructure = await createJsonStructure(basePath);
		userStore.set(MARKETPLACE_INDEX_DATA, jsonStructure);
		await fsp.writeFile(
			path.join(captainDataPath, "index.json"),
			JSON.stringify(jsonStructure, null, 2)
		);
	} catch (error) {
		console.error("Error executing command:", error);
	}
}
