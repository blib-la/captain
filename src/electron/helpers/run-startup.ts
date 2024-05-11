import { apps } from "@/electron/apps";
import { PORTS } from "@/electron/constants";
import { ComfyUI } from "@/electron/services/comfyui";
import { logError, logger } from "@/electron/services/logger";
import { loadURL } from "@/electron/utils/load-window";
import { createCoreWindow, createPromptWindow } from "@/electron/windows";

export async function runStartup() {
	logger.info(`runStartup(): started`);

	logger.info("runStartup(): ComfyUI is starting");
	try {
		await ComfyUI.init({ port: PORTS.COMFYUI, debug: false });
	} catch (error) {
		logError(error, "Can't start ComfyUI");
	} finally {
		apps.prompt = await createPromptWindow();
		logger.info(`runStartup(): created prompt window`);

		apps.core = await createCoreWindow();
		logger.info(`runStartup(): created core window`);

		apps.core.on("close", () => {
			apps.core = null;
			logger.info(`runStartup(): closed core window`);
		});

		await loadURL(apps.core, `core/dashboard`);
		logger.info(`runStartup(): loaded core/dashboard`);
		apps.core.focus();
		logger.info(`runStartup(): focused core window`);
	}
}
