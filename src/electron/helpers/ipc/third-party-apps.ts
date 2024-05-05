import { ipcMain } from "electron";

import { getCaptainApps } from "@/electron/utils/path-helpers";
import { buildKey } from "@/shared/build-key";
import { ID } from "@/shared/enums";

ipcMain.on(buildKey([ID.THIRD_PARTY_APPS], { suffix: "get-path" }), event => {
	event.sender.send(buildKey([ID.THIRD_PARTY_APPS], { suffix: "path" }), getCaptainApps());
});
