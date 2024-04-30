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

	if (process.defaultApp) {
		if (process.argv.length >= 2) {
			const protocol = isDevelopment ? "captain-login-development" : "captain-login";
			app.setAsDefaultProtocolClient(protocol, process.execPath, [
				path.resolve(process.argv[1]),
			]);
		}
	} else {
		app.setAsDefaultProtocolClient("captain-login");
	}
} else {
	// The app is locked, so we force quit the new instance
	console.log("App is locked by another instance. Closing app");
	app.quit();
}
