import process from "process";

import type { ElectronApplication, Page } from "@playwright/test";
import { test, expect } from "@playwright/test";
import { _electron as electron } from "playwright";

import { buildKey } from "#/build-key";
import { ID } from "#/enums";
import type { GitCloneCompleted } from "@/utils/git";

let electronApp: ElectronApplication;
let page: Page;

test.beforeAll(async () => {
	electronApp = await electron.launch({
		args: ["."],
		env: {
			...process.env,
			TEST_VERSION: "upToDate",
			TEST_APP_STATUS: "DONE",
		},
	});
	const isPackaged = await electronApp.evaluate(async ({ app }) => app.isPackaged);
	expect(isPackaged).toBe(false);
});

test.afterAll(async () => {
	await electronApp.close();
});

test("clone a repository until is is completed", async () => {
	page = await electronApp.firstWindow();

	const clone = buildKey([ID.DOWNLOADS], { suffix: ":clone" });
	const cloned = buildKey([ID.DOWNLOADS], { suffix: ":cloned" });

	const result = await page.evaluate(
		([clone, cloned]) =>
			new Promise(resolve => {
				window.ipc.send(clone, {
					repository: "blib-la/captain-test-model",
					destination: "stable-diffusion",
				});

				const unsubscribe = window.ipc.on(cloned, result => {
					unsubscribe();
					resolve(result);
				});
			}),
		[clone, cloned]
	);

	await expect(result).toHaveProperty("path");
	await expect((result as GitCloneCompleted).path).toContain("captain-test-model");
});

test("get the progress when cloning a repository", async () => {
	page = await electronApp.firstWindow();

	const clone = buildKey([ID.DOWNLOADS], { suffix: ":clone" });
	const progress = buildKey([ID.DOWNLOADS], { suffix: ":progress" });

	const result = await page.evaluate(
		([channelKey, progress]) =>
			new Promise(resolve => {
				window.ipc.send(channelKey, {
					repository: "blib-la/captain-test-model",
					destination: "stable-diffusion",
				});

				const unsubscribe = window.ipc.on(progress, result => {
					unsubscribe();
					resolve(result);
				});
			}),
		[clone, progress]
	);

	await expect(result).toHaveProperty("percent");
});

test("clone a repository that doesn't exist", async () => {
	page = await electronApp.firstWindow();

	const clone = buildKey([ID.DOWNLOADS], { suffix: ":clone" });
	const error = buildKey([ID.DOWNLOADS], { suffix: ":error" });

	const result = await page.evaluate(
		([clone, error]) =>
			new Promise(resolve => {
				window.ipc.send(clone, {
					repository: "blib-la/captain-test-model-that-doesnt-exist",
					destination: "stable-diffusion",
				});

				const unsubscribe = window.ipc.on(error, result => {
					unsubscribe();
					resolve(result);
				});
			}),
		[clone, error]
	);

	await expect(result).toContain("Repository not found");
});
