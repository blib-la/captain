jest.mock("electron", () => {
	const mockWebContents = {
		send: jest.fn(),
	};

	const mockFocusedWindow = {
		loadURL: jest.fn(),
		on: jest.fn(),
		once: jest.fn(),
		close: jest.fn(),
		webContents: mockWebContents,
	};
	const mockBrowserWindow = jest.fn().mockImplementation(() => ({
		loadURL: jest.fn(),
		on: jest.fn(),
		once: jest.fn(),
		close: jest.fn(),
		getFocusedWindow: jest.fn(() => mockFocusedWindow),
	}));

	return {
		BrowserWindow: mockBrowserWindow,
		app: {
			getPath: jest.fn(pathName => {
				if (pathName === "userData") {
					return "/mocked/user/data/path";
				}

				return "/mocked/default/path";
			}),
		},
	};
});
