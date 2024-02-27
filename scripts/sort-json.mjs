import { globby } from "globby";
import sortJson from "sort-json";

// Define your options for sorting
const options = { ignoreCase: true };

// Your glob pattern, starting from the current working directory
const pattern = "renderer/public/locales/*/common.json";

try {
	// Use globby to find files matching the pattern
	const paths = await globby(pattern, { absolute: true });
	console.log(paths);

	// Iterate over each file path and sort the JSON
	for (const filePath of paths) {
		console.log(`Sorting JSON file: ${filePath}`);
		// Using sortJson.overwrite to sort and overwrite the file
		await sortJson.overwrite(filePath, options);
		console.log(`Sorted: ${filePath}`);
	}
} catch (error) {
	console.error("Error sorting JSON files:", error);
}
