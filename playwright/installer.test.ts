import type { ElectronApplication, Page } from "@playwright/test";
import { test, expect } from "@playwright/test";
import { _electron as electron } from "playwright";

import { buildKey } from "#/build-key";
import { ID } from "#/enums";

const isLocalEnvironment = process.env.TEST_ENV === "local";
let electronApp: ElectronApplication;
let page: Page;

test.beforeAll(async () => {
	// Use  package.main
	electronApp = await electron.launch({
		args: ["."],
		env: {
			...process.env,
			TEST_ENV: "test",
			TEST_APP_STATUS: "IDLE",
		},
	});
	const isPackaged = await electronApp.evaluate(async ({ app }) => app.isPackaged);

	expect(isPackaged).toBe(false);
});

test.afterAll(async () => {
	await electronApp.close();
});

test("Renders the installer page", async () => {
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

test("Can open page 2 of the installer & download & unpack", async () => {
	page = await electronApp.firstWindow();

	const locale = "de";
	const pathname = "installer/02";

	await page.goto(`app://./${locale}/${pathname}`);
	await expect(page.getByText("Installieren").first()).toBeVisible();
	expect(page.url()).toContain("de/installer/02");

	await page.getByTestId("installer-02-start").click();
});

(isLocalEnvironment ? test : test.skip)("Download and unpack archives", async () => {
	page = await electronApp.firstWindow();

	const start = buildKey([ID.INSTALL], { suffix: ":start" });
	const completed = buildKey([ID.INSTALL], { suffix: ":completed" });

	const result = await page.evaluate(
		([start, completed]) =>
			new Promise(resolve => {
				window.ipc.send(start, [
					{
						url: "https://blibla-captain-assets.s3.eu-central-1.amazonaws.com/test.7z",
						destination: "test",
					},
				]);

				const unsubscribe = window.ipc.on(completed, result => {
					unsubscribe();
					resolve(result);
				});
			}),
		[start, completed]
	);

	await expect(result).toBeTruthy();
});

// Doesn't work yet
test.skip("error when trying to download and unpack archives", async () => {
	page = await electronApp.firstWindow();

	const start = buildKey([ID.INSTALL], { suffix: ":start" });
	const completed = buildKey([ID.INSTALL], { suffix: ":completed" });
	const failed = buildKey([ID.INSTALL], { suffix: ":failed" });

	const result = await page.evaluate(
		([start, completed, failed]) =>
			new Promise(resolve => {
				window.ipc.send(start, {
					url: "https://blibla-captain-assets.s3.eu-central-1.amazonaws.com/asdf",
					destination: "testtest",
				});

				const unsubscribe2 = window.ipc.on(completed, result => {
					unsubscribe2();
					resolve(result);
				});

				const unsubscribe = window.ipc.on(failed, result => {
					unsubscribe();
					resolve(result);
				});
			}),
		[start, completed, failed]
	);

	await expect(result).toHaveProperty("path");
});
