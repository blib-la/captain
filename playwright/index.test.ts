import process from "process";

import type { ElectronApplication, Page } from "@playwright/test";
import { test, expect } from "@playwright/test";
import { _electron as electron } from "playwright";

let electronApp: ElectronApplication;
let page: Page;

test.beforeAll(async () => {
	// Use  package.main
	electronApp = await electron.launch({
		args: ["."],
		env: {
			...process.env,
			NODE_ENV: "development",
		},
	});
	const isPackaged = await electronApp.evaluate(async ({ app }) => app.isPackaged);

	expect(isPackaged).toBe(false);
});

test.afterAll(async () => {
	await electronApp.close();
});

test("Renders the first page", async () => {
	page = await electronApp.firstWindow();
	const title = await page.title();
	expect(title).toBe("Blibla");
});

test("Allows switching the language", async () => {
	page = await electronApp.firstWindow();

	await expect(page.getByTestId("language-selector-list")).toBeVisible();
	await expect(page.getByText("Deutsch")).toBeVisible();
	await page.getByText("Deutsch").click();
	await expect(page.getByText("Sprache")).toBeVisible();
});
