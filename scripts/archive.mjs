import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import Seven from "node-7z";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const my7z = path.join(__dirname, "..", "resources", "7zip", "win", "7za.exe");

const sourceFolder = path.join(__dirname, "..", "resources", "git/win/PortableGit");
const outputArchive = path.join(__dirname, "..", "resources", "portable-git.7z");

const files = await fsp.readdir(sourceFolder);

const archive = Seven.add(
	outputArchive,
	files.map(file => path.join(sourceFolder, file)),
	{
		$bin: my7z,
		recursive: true,
	}
);

archive.on("end", () => {
	console.log("Compression finished");
});

archive.on("error", error => {
	console.error("Compression error:", error);
});
