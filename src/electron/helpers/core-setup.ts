import { app, protocol } from "electron";
import contextMenu from "electron-context-menu";
import serve from "electron-serve";

import { LOCAL_PROTOCOL } from "#/constants";
import { isProduction } from "#/flags";

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
