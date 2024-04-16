import path from "path";

import type electronServe from "electron-serve";
import serve from "electron-serve";
import { globbySync } from "globby";

import { getCaptainData } from "@/utils/path-helpers";

export const appLoaders: Record<string, electronServe.loadURL> = {};

export function registerApps() {
	// Discover all installed apps based on the presence of an 'index.html' in their respective directories.
	const installedApps = globbySync(["*/index.html"], {
		cwd: getCaptainData("apps"),
	});

	// Register a custom protocol for each installed app, allowing them to be served statically.
	for (const installedApp of installedApps) {
		const { dir } = path.parse(installedApp);
		const id = dir.split("/").pop()!;

		appLoaders[id] = serve({
			directory: getCaptainData(`apps`, id),
			scheme: `captn-${id}`,
			hostname: "localhost",
			file: "index",
		});
	}
}
