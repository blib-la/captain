import { existsSync, mkdirSync } from "node:fs";

export function createDirectory(path: string): string {
	if (!existsSync(path)) {
		mkdirSync(path, { recursive: true });
	}

	return path;
}
