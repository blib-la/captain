import fs from "node:fs";
import path from "node:path";

import type { ExecaChildProcess } from "execa";
import { execa } from "execa";

import { createDirectory } from "@/utils/fs";
import { getCaptainData, getCaptainDownloads } from "@/utils/path-helpers";

export interface GitCloneOptions {
	onStarted?: (item: any) => void;
	onProgress?: (progress: GitCloneProgress) => void;
	onCompleted?: (completed: GitCloneCompleted) => void;
}

export interface GitCloneProgress {
	percent: number;
	transferredBytes: number;
	totalBytes: number;
}

export interface GitCloneCompleted {
	path: string;
}

export interface GitCloneInfo {
	repository: string;
	destination: string;
	cancel: () => void;
}

export function git() {
	return getCaptainData("portable-git/bin/git.exe");
}

export async function clone(repository: string, destination: string, options?: GitCloneOptions) {
	const destinationPath = getCaptainDownloads(destination, repository);
	const gitDirectory = path.join(destinationPath, ".git");

	createDirectory(destinationPath);

	let process: ExecaChildProcess | null = null;

	function cancel() {
		if (process) {
			process.kill("SIGTERM");
		}
	}

	options?.onStarted?.({
		repository,
		destination,
		cancel,
	});

	// Update repo if it already exists
	if (fs.existsSync(gitDirectory)) {
		try {
			process = execa(git(), ["pull"], { cwd: destinationPath });
			await process;

			options?.onProgress?.({
				percent: 1,
				transferredBytes: 0,
				totalBytes: 0,
			});
		} catch (error) {
			throw new Error(`Updating repository failed: ${error}`);
		}
	} else {
		// Proceed with cloning
		process = execa(git(), ["clone", "--progress", `git@hf.co:${repository}`, destinationPath]);

		process.stderr?.on("data", (buffer: Buffer) => {
			const output = buffer.toString();
			const progressMatch = output.match(/Receiving objects:\s+(\d+)%/);
			if (progressMatch) {
				const percent = Number.parseFloat(progressMatch[1]) / 100;

				options?.onProgress?.({
					percent,
					transferredBytes: 0,
					totalBytes: 0,
				});
			}
		});

		// Clone
		try {
			await process;
		} catch (error) {
			throw new Error(`Cloning repository failed: ${error}`);
		}
	}

	// Fetch LFS objects
	process = execa(git(), ["lfs", "fetch"], { cwd: destinationPath });

	process.stderr?.on("data", (buffer: Buffer) => {
		const output = buffer.toString();
		const progressMatch = output.match(/(\d+)% \((\d+)\/(\d+)\)/);
		if (progressMatch) {
			const percent = Number.parseFloat(progressMatch[1]) / 100;

			options?.onProgress?.({
				percent,
				totalBytes: 0,
				transferredBytes: 0,
			});
		}
	});

	try {
		await process;
	} catch (error) {
		throw new Error(`Fetching Git LFS objects failed: ${error}`);
	}

	// Checkout LFS objects
	try {
		process = execa(git(), ["lfs", "checkout"], { cwd: destinationPath });
		await process;

		options?.onCompleted?.({
			path: destinationPath,
		});
	} catch (error) {
		throw new Error(`Git LFS checkout failed: ${error}`);
	}
}

export async function lfs() {
	try {
		await execa(git(), ["lfs", "install"]);
		return "Git LFS has been set up successfully.";
	} catch (error) {
		return `Error setting up Git LFS: ${error}`;
	}
}
