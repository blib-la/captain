// Import filesystem and path modules as ESM
import fs from "node:fs";
import path from "node:path";

// Define your source and destination directories using ESM syntax
const templateDirectoryCore = path.join(process.cwd(), "homepage/pages/_captain-core");
const outputDirectoryCore = path.join(process.cwd(), "homepage/pages/captain-core");

const templateDirectorySdk = path.join(process.cwd(), "homepage/pages/_captain-sdk");
const outputDirectorySdk = path.join(process.cwd(), "homepage/pages/captain-sdk");

// Recursive function to copy files using ESM syntax
function copyMetaFiles(source, destination) {
	for (const dirent of fs.readdirSync(source, { withFileTypes: true })) {
		const sourcePath = path.join(source, dirent.name);
		const destinationPath = path.join(destination, dirent.name);

		if (dirent.isDirectory()) {
			copyMetaFiles(sourcePath, destinationPath); // Recurse into subdirectories
		} else if (dirent.name === "_meta.json") {
			fs.copyFileSync(sourcePath, destinationPath); // Copy _meta.json files
			console.log(`Copied: ${sourcePath} -> ${destinationPath}`);
		}
	}
}

// Create the destination directory if it doesn't exist
if (!fs.existsSync(outputDirectoryCore)) {
	fs.mkdirSync(outputDirectoryCore, { recursive: true });
}

if (!fs.existsSync(outputDirectorySdk)) {
	fs.mkdirSync(outputDirectorySdk, { recursive: true });
}

// Start the copying process
copyMetaFiles(templateDirectoryCore, outputDirectoryCore);
copyMetaFiles(templateDirectorySdk, outputDirectorySdk);
