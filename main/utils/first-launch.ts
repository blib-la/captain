import fs from "node:fs";

import { app } from "electron";

import { version } from "../../package.json";
import { getDirectory, getUserData } from "../helpers/utils";

function isError(error: any): error is any {
	return error instanceof Error;
}

/**
It works by writing a file to `app.getPath('userData')` if it doesn't exist and checks that.
That means it will return true the first time you add this check to your app.

@returns A `boolean` of whether it's the first time your app is launched.
 */
export function isFirstAppLaunch() {
	const checkFile = getUserData(`.first-launch--v${version}`);

	if (fs.existsSync(checkFile)) {
		return false;
	}

	try {
		fs.writeFileSync(checkFile, "");
	} catch (error) {
		if (isError(error)) {
			if (error.code === "ENOENT") {
				fs.mkdirSync(app.getPath("userData"));
				return isFirstAppLaunch();
			}
		} else {
			throw error;
		}
	}

	return true;
}

export function isPythonInstalled() {
	// We'll assume that torch is ready when we find the version file
	const torchVersion = getDirectory("python-embedded/installation_successful.flag");

	return fs.existsSync(torchVersion);
}
