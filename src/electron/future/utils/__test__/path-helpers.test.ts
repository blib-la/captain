import path from "path";

import { resourcesDirectory, getDirectory } from "../path-helpers";

jest.mock("electron", () => ({
	app: {
		getPath: jest.fn().mockImplementation((key: string) => {
			switch (key) {
				case "exe": {
					return "/path/to/exe";
				}

				case "userData": {
					return "/path/to/userData";
				}

				default: {
					return "/default/path";
				}
			}
		}),
	},
}));

jest.mock("#/flags", () => ({
	isDevelopment: jest.requireActual("#/flags").isDevelopment,
}));

describe("Path Utilities", () => {
	const originalCwd = process.cwd();

	beforeEach(() => {
		jest.clearAllMocks();
		process.cwd = () => originalCwd;
	});

	afterEach(() => {
		jest.resetModules();
	});

	it("correctly sets resourcesDirectory in development mode", async () => {
		jest.mock("#/flags", () => ({
			isDevelopment: true,
		}));
		const expectedDevelopmentPath = path.join(process.cwd(), "resources");
		// Force re-import to apply the mock
		const { resourcesDirectory } = await import("../path-helpers");
		expect(resourcesDirectory).toEqual(expectedDevelopmentPath);
	});

	it("correctly sets resourcesDirectory in production mode", async () => {
		jest.mock("#/flags", () => ({
			isDevelopment: false,
		}));

		const { resourcesDirectory } = await import("../path-helpers");
		const expectedProductionPath = path.join(
			"/path/to/exe",
			"..",
			"resources",
			"app.asar.unpacked",
			"resources"
		);
		expect(resourcesDirectory).toEqual(expectedProductionPath);
	});

	it("getDirectory combines resourcesDirectory with subpaths", () => {
		const subpath = ["subdir", "file.txt"];
		const expectedPath = path.join(resourcesDirectory, ...subpath);
		expect(getDirectory(...subpath)).toEqual(expectedPath);
	});

	it("getUserData combines userData path with subpaths", async () => {
		const { getUserData } = await import("../path-helpers");

		const subpath = ["config", "settings.json"];
		const expectedPath = path.join("/path/to/userData", ...subpath);
		expect(getUserData(...subpath)).toEqual(expectedPath);
	});

	it("getCaptainData combines userData with Captain_Data and subpaths", async () => {
		const { getCaptainData } = await import("../path-helpers");

		const subpath = ["logs", "log.txt"];
		const expectedPath = path.join("/path/to/userData", "Captain_Data", ...subpath);
		expect(getCaptainData(...subpath)).toEqual(expectedPath);
	});

	it("getCaptainDownloads combines userData with Captain_Data/downloads and subpaths", async () => {
		const { getCaptainDownloads } = await import("../path-helpers");

		const subpath = ["file.zip"];
		const expectedPath = path.join(
			"/path/to/userData",
			"Captain_Data",
			"downloads",
			...subpath
		);
		expect(getCaptainDownloads(...subpath)).toEqual(expectedPath);
	});

	it("getCaptainTemporary combines userData with Captain_Data/temp and subpaths", async () => {
		const { getCaptainTemporary } = await import("../path-helpers");

		const subpath = ["session.json"];
		const expectedPath = path.join("/path/to/userData", "Captain_Data", "temp", ...subpath);
		expect(getCaptainTemporary(...subpath)).toEqual(expectedPath);
	});
});
