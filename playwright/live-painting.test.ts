import type { ElectronApplication, Page } from "@playwright/test";
import { test, expect } from "@playwright/test";
import { _electron as electron } from "playwright";

let electronApp: ElectronApplication;
let page: Page;

test.beforeAll(async () => {
	electronApp = await electron.launch({ args: ["."] });
	const isPackaged = await electronApp.evaluate(async ({ app }) => app.isPackaged);

	expect(isPackaged).toBe(false);
});

test.afterAll(async () => {
	await electronApp.close();
});

test("Open Live Painting", async () => {
	page = await electronApp.firstWindow();

	await expect(page.getByTestId("sidebar-live-painting")).toBeVisible();
	await page.getByTestId("sidebar-live-painting").click();
	await expect(page.getByText("Live Painting")).toBeVisible();
});
