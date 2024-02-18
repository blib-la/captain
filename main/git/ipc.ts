import { ipcMain } from "electron";

import { GIT } from "../helpers/constants";
import { store } from "../helpers/store";

import { runGitLFSCommand } from "./index";

ipcMain.handle(`${GIT}:lfs-clone`, async (_event, location: string, repo: string, options) => {
	store.set(options.storeKey, true);
	try {
		await runGitLFSCommand(location, repo);
	} finally {
		store.set(options.storeKey, false);
	}
});
