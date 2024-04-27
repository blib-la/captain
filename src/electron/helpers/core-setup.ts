import path from "node:path";

import { app, protocol } from "electron";
import contextMenu from "electron-context-menu";
import serve from "electron-serve";

import { LOCAL_PROTOCOL } from "#/constants";
import { isProduction, isTest } from "#/flags";

// Obtain a lock to check if the app is locked (primary instance)
// If false, we close the app, as we want to prevent multiple instances of our app
// https://github.com/electron/electron/blob/v30.0.0-nightly.20240221/docs/api/app.md#apprequestsingleinstancelockadditionaldata
export const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock && !isTest) {
	// The app is locked, so we force quit the new instance
	console.log("App is locked by another instance. Closing app");
	app.quit();
}

if (isProduction) {
	serve({ directory: "app" });
} else {
	app.setPath("userData", `${app.getPath("userData")}__development__`);
}

protocol.registerSchemesAsPrivileged([
	{ scheme: LOCAL_PROTOCOL, privileges: { secure: true, standard: true, bypassCSP: true } },
]);

contextMenu({
	showSaveImageAs: true,
	showSearchWithGoogle: false,
});

app.commandLine.appendSwitch("enable-smooth-scrolling");

if (process.defaultApp) {
	if (process.argv.length >= 2) {
		app.setAsDefaultProtocolClient("captain-login", process.execPath, [
			path.resolve(process.argv[1]),
		]);
	}
} else {
	app.setAsDefaultProtocolClient("captain-login");
}
