import type { BrowserWindow } from "electron";

jest.mock("electron", () => ({
	BrowserWindow: jest.fn().mockImplementation(() => ({
		loadURL: jest.fn().mockResolvedValue(null),
	})),
	app: {
		getPath: jest.fn(),
	},
}));

jest.mock("@/utils/locale", () => ({
	getLocale: jest.fn(),
}));

jest.mock("@/services/logger", () => ({
	create: jest.fn(),
}));

describe("loadURL", () => {
	let windowMock: BrowserWindow;

	beforeEach(async () => {
		// Clear all mocks before each test
		jest.resetAllMocks();
		jest.resetModules(); // Important to reset module cache

		// Setup BrowserWindow mock
		const { BrowserWindow } = await import("electron");
		windowMock = new BrowserWindow();
	});

	it("loads the correct URL in production environment", async () => {
		// Mock flags and utils inside the test to ensure isolation
		jest.doMock("#/flags", () => ({
			isProduction: true,
		}));
		const { getLocale } = await import("@/utils/locale");
		(getLocale as jest.Mock).mockReturnValue("en");

		// Dynamically import the function under test
		const { loadURL } = await import("../load-window");

		const pathname = "test.html";
		await loadURL(windowMock, pathname);

		expect(windowMock.loadURL).toHaveBeenCalledWith(`app://./en/${pathname}`);
	});

	it("loads the correct URL in development environment", async () => {
		jest.doMock("#/flags", () => ({
			isProduction: false,
		}));
		const { getLocale } = await import("@/utils/locale");
		(getLocale as jest.Mock).mockReturnValue("en");

		// Dynamically import the function under test
		const { loadURL } = await import("../load-window");

		const pathname = "test.html";
		process.argv[2] = "3000"; // Simulate command-line argument for port
		await loadURL(windowMock, pathname);

		expect(windowMock.loadURL).toHaveBeenCalledWith(`http://localhost:3000/en/${pathname}`);
	});
});
