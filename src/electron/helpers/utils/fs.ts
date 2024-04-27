import fs, { existsSync, mkdirSync } from "node:fs";

export function createDirectory(path: string): string {
	if (!existsSync(path)) {
		mkdirSync(path, { recursive: true });
	}

	return path;
}

/**
 * Delete all files within the specified directory.
 *
 * @param path - The directory path where files will be deleted.
 */
export function clearDirectory(path: string) {
	try {
		const files = fs.readdirSync(path);
		for (const file of files) {
			const filePath = `${path}/${file}`;
			fs.unlinkSync(filePath);
		}
	} catch (error) {
		console.error(`Error deleting files: ${error}`);
	}
}
