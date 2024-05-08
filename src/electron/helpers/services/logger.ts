import path from "node:path";

import { app } from "electron";
import logger from "electron-log/node";

import { jsonStringify } from "@/shared/object";

import "@/electron/core-setup";

logger.transports.file.level = "info";
logger.transports.console.format = "{h}:{i}:{s} {text}";
logger.transports.file.getFile().clear();
logger.transports.file.resolvePathFn = () => path.join(app.getPath("userData"), "logs/main.log");

export function logError(error: unknown, prefix?: string) {
	if (error instanceof Error) {
		logger.error(prefix, error.message, error.stack);
	} else if (error instanceof Object) {
		logger.error(prefix, jsonStringify(error as Record<string, unknown>));
	} else {
		logger.error(prefix, error);
	}
}

export { default as logger } from "electron-log/node";
