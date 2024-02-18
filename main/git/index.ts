import { exec } from "child_process";

import { getDirectory, getUserData } from "../helpers/utils";

export function runGitCommand(command: string) {
	const gitPath = getDirectory("git/PortableGit/bin/git.exe");

	// Then run your Git command
	const gitVersionCommand = `"${gitPath}" ${command}`;
	exec(gitVersionCommand, (error, stdout, stderr) => {
		if (error) {
			console.error(`Git exec error: ${error}`);
			return;
		}

		if (stderr) {
			console.error(`Git stderr: ${stderr}`);
			return;
		}

		console.log(`Git version: ${stdout}`);
	});
}

export function runGitLFSCommand(location: string, repo: string) {
	const gitLfsPath = getDirectory("git/GitLFS/git-lfs.exe");
	const downloadsPath = getUserData("Captain_Data/downloads/", location, repo);

	const gitLfsCommand = `"${gitLfsPath}" install`;
	exec(gitLfsCommand, (error, stdout, stderr) => {
		if (error) {
			console.error(`Git LFS exec error: ${error}`);
			return;
		}

		if (stderr) {
			console.error(`Git LFS stderr: ${stderr}`);
			return;
		}

		console.log(stdout);
		runGitCommand(`clone https://huggingface.co/${repo} ${downloadsPath}`);
	});
}
