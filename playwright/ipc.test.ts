import type { ElectronApplication, Page } from "@playwright/test";
import { test, expect } from "@playwright/test";
import { _electron as electron } from "playwright";
let electronApp: ElectronApplication;
let page: Page;

test.beforeAll(async () => {
	electronApp = await electron.launch({
		args: ["."],
	});
	const isPackaged = await electronApp.evaluate(async ({ app }) => app.isPackaged);

	expect(isPackaged).toBe(false);
});

test.afterAll(async () => {
	await electronApp.close();
});

test("Tests IPC", async () => {
	page = await electronApp.firstWindow();
	const result = await page.evaluate(
		() =>
			new Promise(resolve => {
				window.ipc.send("test", "hello");
				window.ipc.on("test", result => {
					resolve(result);
				});
			})
	);
	await expect(result).toBe("hello");
});
