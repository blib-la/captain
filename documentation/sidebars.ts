import fs from "node:fs";
import path from "node:path";

import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";
import humanizeString from "humanize-string";

const apiDirectory = path.join(__dirname, "docs", "api");

function getDirectories(source: string): string[] {
	return fs
		.readdirSync(source, { withFileTypes: true })
		.filter(dirent => dirent.isDirectory())
		.map(dirent => dirent.name);
}

const mainCategories = getDirectories(apiDirectory);

const subCategories = ["client", "electron", "shared"];

function generateSidebar(): SidebarsConfig {
	const apiSidebar = [
		{
			type: "doc" as const,
			id: `api/README`,
			label: "Welcome to Captain",
		},
	];

	for (const mainCategory of mainCategories) {
		const categoryPath = path.join(apiDirectory, mainCategory);
		if (fs.existsSync(categoryPath)) {
			const files = fs.readdirSync(categoryPath).filter(file => file.endsWith(".md"));
			const categoryItems = subCategories.map(subCategory =>
				generateSubCategory(files, subCategory, mainCategory)
			);
			apiSidebar.push({
				// The nested object work but docusaurus types don't allow it, and they don't export
				// the type to allow us to satisfy or cast the type here.
				// Let's hack it to allow a nested sidebar
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				type: "category",
				label: humanizeString(mainCategory),
				items: categoryItems.filter(item => item.items.length > 0), // Filter out empty categories
			});
		}
	}

	return { apiSidebar } satisfies SidebarsConfig;
}

function generateSubCategory(files: string[], subCategory: string, mainCategory: string) {
	const items = files
		.filter(file => file.startsWith(`${subCategory}_`))
		.map(file => ({
			type: "doc" as const,
			id: `api/${mainCategory}/${file.replace(".md", "")}`,
			label: cleanFileName(file, subCategory),
		}));

	return {
		type: "category" as const,
		label: humanizeString(subCategory),
		items,
	};
}

function cleanFileName(filename: string, subCategory: string): string {
	return filename
		.replace(`${subCategory}_`, "")
		.replaceAll("_", " ")
		.replace(".md", "")
		.replaceAll(".", " ")
		.split(" ")
		.map(label => humanizeString(label))
		.join(" ");
}

export default generateSidebar();
