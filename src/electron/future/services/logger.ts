import * as winston from "winston";

import { createDirectory, clearDirectory } from "@/utils/fs";
import { getCaptainData } from "@/utils/path-helpers";

/**
 * Creates and configures a Winston logger with file and console transports.
 * File transports log error and combined logs to specified files within the user's log directory.
 * In non-production environments, logs are also output to the console.
 *
 * @returns {winston.Logger} A Winston Logger instance.
 */
function create() {
	const logger = winston.createLogger({
		level: "info",
		format: winston.format.combine(
			winston.format.timestamp({
				format: "YYYY-MM-DD HH:mm:ss",
			}),
			winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
		),
		transports: [],
	});

	// In production, log to files
	if (process.env.NODE_ENV === "production") {
		logger.add(
			new winston.transports.File({
				filename: getCaptainData("logs", "error.log"),
				level: "error",
			})
		);
		logger.add(
			new winston.transports.File({
				filename: getCaptainData("logs", "combined.log"),
			})
		);
	}

	// Always log to the console
	logger.add(
		new winston.transports.Console({
			format: winston.format.simple(),
		})
	);

	return logger;
}

const logsPath = getCaptainData("logs");

// Make sure the logs directory exists
await createDirectory(logsPath);

// Delete old logs
await clearDirectory(logsPath);

// Create logger
const logger = create();

export default logger;
