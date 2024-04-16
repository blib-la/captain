import { BrowserWindow } from "electron";
import Store from "electron-store";
import type { DeepMockProxy } from "jest-mock-extended";
import { mockDeep } from "jest-mock-extended";

import { createWindow } from "@/utils/create-window";

jest.mock("electron", () => ({
	BrowserWindow: jest.fn().mockImplementation(() => ({
		webContents: {
			setWindowOpenHandler: jest.fn(),
		},
		on: jest.fn(),
		isMinimized: jest.fn(),
		isMaximized: jest.fn(),
	})),
	shell: {
		openExternal: jest.fn(),
	},
	screen: {
		getAllDisplays: jest.fn().mockReturnValue([
			{
				bounds: { x: 0, y: 0, width: 1024, height: 768 },
			},
		]),
		getPrimaryDisplay: jest.fn().mockReturnValue({
			bounds: { x: 0, y: 0, width: 1920, height: 1080 },
			workArea: { x: 0, y: 0, width: 1920, height: 1040 },
		}),
	},
	app: {
		getPath: jest.fn(pathName => {
			if (pathName === "userData") {
				return "/mocked/user/data/path";
			}

			return "/mocked/default/path";
		}),
	},
}));

jest.mock("electron-store", () => ({
	__esModule: true,
	default: jest.fn(),
}));

describe("createWindow", () => {
	const defaultState = { x: 100, y: 100, width: 1024, height: 768 };
	let storeMock: DeepMockProxy<Store>;

	beforeEach(() => {
		storeMock = mockDeep<Store>();
		(Store as unknown as jest.Mock).mockImplementation(() => storeMock);
		storeMock.get.mockReturnValue(defaultState);
	});

	it("should create a BrowserWindow with default size when no state is saved", async () => {
		await createWindow("testWindow", {});

		expect(BrowserWindow).toHaveBeenCalledWith(
			expect.objectContaining({
				webPreferences: expect.objectContaining({
					contextIsolation: true,
					nodeIntegration: false,
				}),
			})
		);
	});
});
