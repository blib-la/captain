import fsp from "node:fs/promises";

import { getDirectory } from "../helpers/utils";

export async function getInstalledVersion() {
	// We'll assume that torch is ready when we find the version file
	const captionInstallVersion = getDirectory("python-embedded/installation_successful.flag");
	try {
		const lastVersion = await fsp.readFile(captionInstallVersion, "utf8");
		return lastVersion.trim();
	} catch {
		return null;
	}
}

export async function isPythonInstalled(version: string) {
	// We'll assume that torch is ready when we find the version file
	const captionInstallVersion = getDirectory("python-embedded/installation_successful.flag");
	try {
		const lastVersion = await fsp.readFile(captionInstallVersion, "utf8");
		return lastVersion.trim() === version.trim();
	} catch {
		return false;
	}
}
