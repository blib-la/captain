import fsp from "node:fs/promises";

import * as winston from "winston";

import { createDirectory } from "@/utils/fs";
import { getCaptainData } from "@/utils/path-helpers";

// Make sure the logs directory exists
await createDirectory(getCaptainData("logs"));

async function clear(path: string) {
	try {
		const files = await fsp.readdir(path);
		for (const file of files) {
			const filePath = `${path}/${file}`;
			await fsp.unlink(filePath);
		}
	} catch (error) {
		console.error(`Error clearing log files: ${error}`);
	}
}

function create() {
	const logger = winston.createLogger({
		level: "info",
		format: winston.format.combine(
			winston.format.timestamp({
				format: "YYYY-MM-DD HH:mm:ss",
			}),
			winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
		),
		transports: [
			new winston.transports.File({
				filename: getCaptainData("logs", "error.log"),
				level: "error",
			}),
			new winston.transports.File({ filename: getCaptainData("logs", "combined.log") }),
		],
	});

	// If we're not in production, log to the `console`
	if (process.env.NODE_ENV !== "production") {
		logger.add(
			new winston.transports.Console({
				format: winston.format.simple(),
			})
		);
	}

	return logger;
}

const logsPath = getCaptainData("logs");

// Make sure the logs directory exists
await createDirectory(logsPath);

// Delete old logs
await clear(logsPath);

// Create logger
const logger = create();

export default logger;
