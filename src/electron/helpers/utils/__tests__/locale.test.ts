import { app } from "electron";

import i18next from "../../../../../next-i18next.config";
import { getLocale } from "../locale";

import { userStore } from "@/stores";

// Mock the entire electron module
jest.mock("electron", () => ({
	app: {
		getLocale: jest.fn(),
	},
}));

// Explicitly declare the type of the mock for userStore.get
jest.mock("@/stores", () => ({
	userStore: {
		get: jest.fn(),
	},
}));

describe("getLocale", () => {
	afterEach(() => {
		jest.resetAllMocks();
	});

	it("should return the user-defined language if set", () => {
		// Here we use casting to tell TypeScript that this is a mock function
		(userStore.get as jest.Mock).mockReturnValue("de");
		expect(getLocale()).toBe("de");
		expect(userStore.get).toHaveBeenCalledWith("language");
	});

	it("should return the system's preferred language if no user preference is set", () => {
		(userStore.get as jest.Mock).mockReturnValue(null); // No user preference
		(app.getLocale as jest.Mock).mockReturnValue("en-US");
		i18next.i18n.locales = ["en", "de"]; // Assuming these are the supported locales
		expect(getLocale()).toBe("en");
		expect(app.getLocale).toHaveBeenCalled();
	});

	it("should return the default locale if no user preference is set and system language is not supported", () => {
		(userStore.get as jest.Mock).mockReturnValue(null); // No user preference
		(app.getLocale as jest.Mock).mockReturnValue("fr-CA"); // Not supported
		i18next.i18n.defaultLocale = "en"; // Default locale
		i18next.i18n.locales = ["en", "de"]; // Supported locales
		expect(getLocale()).toBe("en");
	});
});
