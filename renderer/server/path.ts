import path from "node:path";

export function getRootFolder(
	record: Partial<{ [key: string]: string }>,
	fallback = path.join(process.cwd(), "public/demo")
) {
	return record.selectedDirectory ?? fallback;
}
