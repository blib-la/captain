import { apps } from "@/apps";
import logger from "@/services/logger";
import { loadURL } from "@/utils/load-window";
import { createCoreWindow, createPromptWindow } from "@/windows";

export async function runStartup() {
	logger.info(`runStartup(): started`);

	apps.prompt = await createPromptWindow();
	logger.info(`runStartup(): created prompt window`);

	apps.core = await createCoreWindow();
	logger.info(`runStartup(): created core window`);

	await loadURL(apps.core, `core/dashboard`);
	logger.info(`runStartup(): loaded core/dashboard`);

	apps.core.on("close", () => {
		apps.core = null;
	});
	apps.core.focus();
	logger.info(`runStartup(): focused core window`);
}
