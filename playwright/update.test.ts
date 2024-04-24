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
			TEST_ENV: "test",
			TEST_APP_STATUS: "UPDATE",
		},
	});
	const isPackaged = await electronApp.evaluate(async ({ app }) => app.isPackaged);

	expect(isPackaged).toBe(false);
});

test.afterAll(async () => {
	await electronApp.close();
});

test("Renders the update page", async () => {
	page = await electronApp.firstWindow();
	const title = await page.title();
	expect(title).toBe("Captain");
});

test("Shows the update button", async () => {
	page = await electronApp.firstWindow();

	await expect(page.getByTestId("installer-02-start")).toBeVisible();
});
