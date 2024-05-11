import { autoUpdater } from "electron-updater";

import {
	checkUpdates,
	checkCoreUpdates,
	downloadCoreUpdate,
	restartAndInstall,
	listenForUpdates,
} from "../update";

import { appSettingsStore } from "@/electron/stores";

jest.mock("@/electron/stores", () => ({
	appSettingsStore: {
		get: jest.fn(),
	},
}));

jest.mock("electron", () => ({
	app: {
		requestSingleInstanceLock: jest.fn(),
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

jest.mock("electron-updater", () => ({
	autoUpdater: {
		checkForUpdatesAndNotify: jest.fn(),
		downloadUpdate: jest.fn(),
		quitAndInstall: jest.fn(),
		allowPrerelease: false,
		autoDownload: false,
		on: jest.fn(),
	},
}));

jest.mock("@/electron/services/logger", () => ({
	logger: {
		info: jest.fn(),
	},
	logError: jest.fn(),
}));

jest.mock("@/electron/apps", () => ({
	apps: {
		core: {
			webContents: {
				send: jest.fn(),
			},
		},
	},
}));

jest.mock("@/electron/windows", () => ({
	openCore: jest.fn(),
}));

jest.mock("@/shared/build-key", () => ({
	buildKey: jest.fn((ids, options) => `${ids[0]}${options.suffix}`),
}));

describe("listenForUpdates", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		listenForUpdates();
	});

	it("should set allowPrerelease to true and autoDownload to false", () => {
		expect(autoUpdater.allowPrerelease).toBe(true);
		expect(autoUpdater.autoDownload).toBe(false);
	});
});

describe("checkUpdates", () => {
	const manifest = {
		windows: [
			{
				name: "python-embedded",
				version: "1.0.1",
				sources: [
					{
						url: "https://blibla-captain-assets.s3.eu-central-1.amazonaws.com/python-embedded-win.7z",
						destination: "python-embedded",
						name: "Python + Dependencies",
						size: "2.1 GB",
						unzip: true,
					},
				],
			},
		],
	};

	it("should return a list of resources that need updating for 'windows'", () => {
		(appSettingsStore.get as jest.Mock).mockImplementation(key => {
			if (key === "resources.python-embedded.version") {
				return "1.0.0";
			}
		});

		const updates = checkUpdates(manifest, "windows");
		expect(updates.length).toBe(1);
		expect(updates[0].name).toBe("python-embedded");
		expect(appSettingsStore.get).toHaveBeenCalledWith("resources.python-embedded.version");
	});

	it("should return an empty array when all resources are up to date or the OS key does not exist", () => {
		(appSettingsStore.get as jest.Mock).mockImplementation(key => {
			if (key === "resources.python-embedded.version") {
				return "1.0.1";
			}
		});

		const updates = checkUpdates(manifest, "windows");
		expect(updates).toEqual([]);

		const updatesForMissingOS = checkUpdates(manifest, "linux");
		expect(updatesForMissingOS).toEqual([]);
	});
});

describe("checkCoreUpdates", () => {
	it("should trigger an update check and notify the user", async () => {
		await checkCoreUpdates();
		expect(autoUpdater.checkForUpdatesAndNotify).toHaveBeenCalled();
	});
});

describe("downloadCoreUpdate", () => {
	it("should trigger the download of updates", async () => {
		await downloadCoreUpdate();
		expect(autoUpdater.downloadUpdate).toHaveBeenCalled();
	});
});

describe("restartAndInstall", () => {
	it("should restart the application and install the update", () => {
		restartAndInstall();
		expect(autoUpdater.quitAndInstall).toHaveBeenCalled();
	});
});
