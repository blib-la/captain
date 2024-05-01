import console from "node:console";
import path from "node:path";
import process from "node:process";

import { app, protocol } from "electron";
import contextMenu from "electron-context-menu";
import serve from "electron-serve";

import { LOCAL_PROTOCOL } from "#/constants";
import { gotTheLock, isDevelopment, isProduction, isTest } from "#/flags";

if (gotTheLock || isTest) {
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

	const defaultProtocol = isDevelopment ? "captain-login-development" : "captain-login";
	if (process.defaultApp) {
		if (process.argv.length >= 2) {
			app.setAsDefaultProtocolClient(defaultProtocol, process.execPath, [
				path.resolve(process.argv[1]),
			]);
		}
	} else {
		app.setAsDefaultProtocolClient(defaultProtocol);
	}
} else {
	// The app is locked, so we force quit the new instance
	// Use native log here since this is before the logger was initialized
	console.log("App is locked by another instance. Closing app");
	app.quit();
}
