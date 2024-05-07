import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const readmePath = path.join(__dirname, "../README.md");
const version = process.argv[2];

const latestRelease = `"https://github.com/blib-la/captain/releases/download/v${version}/Captain-Setup-${version}.exe"`;

// Template for the new content to insert between <!-- releases --> and <!-- releasesstop -->
const releasesTemplate = `
<div align="center">
  <a href=${latestRelease}>
    <img alt="Windows" src="https://img.shields.io/badge/Windows-Download Now-2c2?style=for-the-badge"/>
  </a>
</div>
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

// Rewrite the latest-release.ts to get the download link on our homepage

const heroPath = path.join(__dirname, "../homepage/latest-release.ts");
const heroReleaseTemplate = `export const latestRelease =
	${latestRelease};
`;

// Update latest-release.ts
fs.writeFileSync(heroPath, heroReleaseTemplate);
