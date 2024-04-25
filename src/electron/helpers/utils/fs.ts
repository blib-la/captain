import { existsSync, mkdirSync } from "node:fs";
import fsp from "node:fs/promises";

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
export async function clearDirectory(path: string) {
	try {
		const files = await fsp.readdir(path);
		for (const file of files) {
			const filePath = `${path}/${file}`;
			await fsp.unlink(filePath);
		}
	} catch (error) {
		console.error(`Error deleting files: ${error}`);
	}
}
