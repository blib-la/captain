import { apps } from "@/electron/apps";
import { ComfyUI } from "@/electron/services/comfyui";
import { logError, logger } from "@/electron/services/logger";
import { loadURL } from "@/electron/utils/load-window";
import { createCoreWindow, createPromptWindow } from "@/electron/windows";

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

	logger.info("runStartup(): ComfyUI is starting");
	try {
		ComfyUI.init();
	} catch (error) {
		logError(error, "Can't start ComfyUI");
	}
}
