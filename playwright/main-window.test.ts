import process from "process";

import type { ElectronApplication, Page } from "@playwright/test";
import { test, expect } from "@playwright/test";
import { _electron as electron } from "playwright";
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

test("Renders the dashboard page", async () => {
	page = await electronApp.firstWindow();
	await expect(page.url()).toContain("dashboard");
});

test("Open Live Painting", async () => {
	page = await electronApp.firstWindow();

	await page.getByTestId("sidebar-live-painting").click();
	await expect(page.url()).toContain("live-painting");
});

test("Open Settings", async () => {
	page = await electronApp.firstWindow();

	await page.getByTestId("sidebar-settings").click();
	await expect(page.url()).toContain("settings");
});
