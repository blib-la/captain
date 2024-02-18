import { ipcMain } from "electron";

import { GIT } from "../helpers/constants";

import { runGitLFSCommand } from "./index";

ipcMain.handle(`${GIT}:lfs-clone`, async (_event, location: string, repo: string) => {
	await runGitLFSCommand(location, repo);
});
