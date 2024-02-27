import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const readmePath = path.join(__dirname, "../README.md");
const version = process.argv[2];

// Template for the new content to insert between <!-- releases --> and <!-- releasesstop -->
const releasesTemplate = `
<p align="center">
  <a href="https://github.com/blib-la/captain/releases/download/v${version}/Captain-Setup-${version}.exe">
    <img src="./docs/download.svg" alt="Download Captain" width="300">
  </a>
</p>
`;

// Read README.md
const readmeContent = fs.readFileSync(readmePath, "utf8");

// Replace the content between <!-- releases --> and <!-- releasesstop -->
const updatedReadmeContent = readmeContent.replace(
	/(<!-- releases -->)[\S\s]*?(<!-- releasesstop -->)/,
	`$1${releasesTemplate}$2`
);

// Update README.md
fs.writeFileSync(readmePath, updatedReadmeContent);
