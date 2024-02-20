import { shell } from "electron";

export interface OpenNewGitHubIssueOptions {
	repoUrl?: string;
	user?: string;
	repo?: string;
	body?: string;
	title?: string;
	labels?: string[];
	template?: string;
	milestone?: string;
	assignee?: string;
	projects?: string[];
}

export function newGithubIssueUrl(
	options: { repoUrl?: string; user?: string; repo?: string } = {}
) {
	let repoUrl;
	if (options.repoUrl) {
		repoUrl = options.repoUrl;
	} else if (options.user && options.repo) {
		repoUrl = `https://github.com/${options.user}/${options.repo}`;
	} else {
		throw new Error(
			"You need to specify either the `repoUrl` option or both the `user` and `repo` options"
		);
	}

	const url = new URL(`${repoUrl}/issues/new`);

	const types = ["body", "title", "labels", "template", "milestone", "assignee", "projects"];

	for (const type of types) {
		let value = options[type as keyof typeof options];
		if (value === undefined) {
			continue;
		}

		if (type === "labels" || type === "projects") {
			if (!Array.isArray(value)) {
				throw new TypeError(`The \`${type}\` option should be an array`);
			}

			value = value.join(",");
		}

		url.searchParams.set(type, value);
	}

	return url.toString();
}

/**
 Opens the new issue view on the given GitHub repo in the browser.
 Optionally, with some fields like title and body prefilled.

 @param options - The options are passed to the [`new-github-issue-url`](https://github.com/sindresorhus/new-github-issue-url#options) package.

 @example
 ```
 import {openNewGitHubIssue} from 'electron-util';

 openNewGitHubIssue({
 user: 'sindresorhus',
 repo: 'playground',
 body: 'Hello'
 });
 */
export async function openNewGitHubIssue(options: OpenNewGitHubIssueOptions) {
	const url = newGithubIssueUrl(options);
	await shell.openExternal(url);
}
