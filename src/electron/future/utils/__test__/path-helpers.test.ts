import path from "path";

import { app } from "electron";

import {
	resourcesDirectory,
	getDirectory,
	getUserData,
	getCaptainData,
	getCaptainDownloads,
} from "../path-helpers";

// Mock the necessary modules
jest.mock("electron", () => ({
	app: {
		getPath: jest.fn().mockImplementation((key: string) => {
			if (key === "exe") {
				return "/path/to/exe";
			}

			return "/default/path";
		}),
	},
}));

// Set up a manual mock for isDevelopment within the flags module
jest.mock("#/flags", () => ({
	isDevelopment: jest.requireActual("#/flags").isDevelopment,
}));

describe("Path Utilities", () => {
	const originalCwd = process.cwd();
	const mockedAppGetPath = app.getPath as jest.MockedFunction<typeof app.getPath>;

	beforeEach(() => {
		jest.clearAllMocks();
		process.cwd = () => originalCwd; // Ensure cwd is reset if it was modified
		mockedAppGetPath.mockClear();
	});

	afterEach(() => {
		jest.resetModules(); // Ensure modules are fresh for each test
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
		mockedAppGetPath.mockReturnValue("/path/to/exe");
		// Force re-import to apply the mock
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

	it("getUserData combines userData path with subpaths", () => {
		mockedAppGetPath.mockReturnValueOnce("/path/to/userData");
		const subpath = ["config", "settings.json"];
		const expectedPath = path.join("/path/to/userData", ...subpath);
		expect(getUserData(...subpath)).toEqual(expectedPath);
	});

	it("getCaptainData combines userData with Captain_Data and subpaths", () => {
		mockedAppGetPath.mockReturnValueOnce("/path/to/userData");
		const subpath = ["logs", "log.txt"];
		const expectedPath = path.join("/path/to/userData", "Captain_Data", ...subpath);
		expect(getCaptainData(...subpath)).toEqual(expectedPath);
	});

	it("getCaptainDownloads combines userData with Captain_Data/downloads and subpaths", () => {
		mockedAppGetPath.mockReturnValueOnce("/path/to/userData");
		const subpath = ["file.zip"];
		const expectedPath = path.join(
			"/path/to/userData",
			"Captain_Data",
			"downloads",
			...subpath
		);
		expect(getCaptainDownloads(...subpath)).toEqual(expectedPath);
	});
});
