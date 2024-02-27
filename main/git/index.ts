import { exec } from "child_process";

import { getDirectory, getUserData } from "../helpers/utils";

export function runGitCommand(command: string) {
	const gitPath = getDirectory("git/PortableGit/bin/git.exe");

	// Then run your Git command
	const gitVersionCommand = `"${gitPath}" ${command}`;
	return new Promise((resolve, reject) => {
		exec(gitVersionCommand, (error, stdout, stderr) => {
			if (error) {
				console.error(`Git exec error: ${error}`);
				return reject(error);
			}

			if (stderr) {
				console.error(`Git stderr: ${stderr}`);
				return resolve(true);
			}

			console.error(`Git stdout: ${stdout}`);
			resolve(true);
		});
	});
}

export function runGitLFSCommand(location: string, repo: string) {
	const gitLfsPath = getDirectory("git/GitLFS/git-lfs.exe");
	const downloadsPath = getUserData("Captain_Data/downloads/", location, repo);

	const gitLfsCommand = `"${gitLfsPath}" install`;
	return new Promise((resolve, reject) => {
		exec(gitLfsCommand, async (error, stdout, stderr) => {
			if (error) {
				console.error(`Git LFS exec error: ${error}`);
				return reject(error);
			}

			if (stderr) {
				console.error(`Git LFS stderr: ${stderr}`);
				return resolve(true);
			}

			console.error(`Git LFS stdout: ${stdout}`);
			try {
				await runGitCommand(`clone https://huggingface.co/${repo} ${downloadsPath}`);
				resolve(true);
			} catch (error) {
				reject(error);
			}
		});
	});
}
// Error occurred in handler for 'GIT:lfs-clone': Error: Cloning into 'C:\Users\greg\AppData\Roaming\captain__development__\Captain_Data\downloads\caption\llava\llava-hf\llava-1.5-7b-hf'...
// Filtering content: 100% (4/4), 5.15 GiB | 18.51 MiB/s, done.
