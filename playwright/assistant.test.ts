import process from "process";

import type { ElectronApplication, Page } from "@playwright/test";
import { test, expect } from "@playwright/test";
import { _electron as electron } from "playwright";

import { buildKey } from "#/build-key";
import { ID } from "#/enums";
import type { File } from "@/utils/vector-store";

let electronApp: ElectronApplication;
let page: Page;

test.beforeAll(async () => {
	electronApp = await electron.launch({
		args: ["."],
		env: {
			...process.env,
			TEST_ENV: "test",
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

test("assistant saves a file in the vector store", async () => {
	page = await electronApp.firstWindow();

	const save = buildKey([ID.ASSISTANT], { suffix: ":save" });
	const saved = buildKey([ID.ASSISTANT], { suffix: ":saved" });

	const result = await page.evaluate(
		([save, saved]) =>
			new Promise<File[]>(resolve => {
				window.ipc.send(save, [
					{
						data: "# This is a file",
						path: "file.md",
					},
				]);

				const unsubscribe = window.ipc.on(saved, result => {
					unsubscribe();
					resolve(result);
				});
			}),
		[save, saved]
	);

	await expect(result).toHaveLength(1);

	await expect(result[0].path).toBe("file.md");

	await expect(result[0].metadata).toBeDefined();
});
