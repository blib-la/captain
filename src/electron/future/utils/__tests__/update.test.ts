import { appSettingsStore } from "@/stores";
import { checkUpdates } from "@/utils/update";

jest.mock("@/stores", () => ({
	appSettingsStore: {
		get: jest.fn(),
	},
}));

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
