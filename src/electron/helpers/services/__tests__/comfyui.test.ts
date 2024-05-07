import fsp from "node:fs/promises";
import { PassThrough } from "stream";

import axios from "axios";
import { execa } from "execa";
import { stringify } from "yaml";

import { ComfyUI } from "../comfyui";

import { getCaptainTemporary } from "@/electron/utils/path-helpers";

jest.mock("axios");
jest.mock("execa");
jest.mock("ws");
jest.mock("node:fs/promises");

jest.mock("@/electron/services/logger", () => ({
	logger: {
		info: jest.fn(),
		error: jest.fn(),
	},
	logError: jest.fn(),
}));

(axios.get as jest.Mock).mockImplementation((url: string) => {
	if (url.includes("/system_stats")) {
		return Promise.resolve({ status: 200 });
	}

	return Promise.reject(new Error("not found"));
});

jest.mock("@/electron/utils/path-helpers", () => ({
	getCaptainDownloads: jest.fn().mockReturnValue("/path/to/downloads"),
	getCaptainTemporary: jest.fn().mockReturnValue("/path/to/temporary"),
	getCaptainData: jest.fn().mockReturnValue("/path/to/data"),
}));

jest.mock("@/electron/utils/fs", () => ({
	createDirectory: jest.fn().mockResolvedValue(true),
}));

(execa as jest.Mock).mockImplementation(() => {
	const mockStdout = new PassThrough();
	const mockStderr = new PassThrough();
	const result = Promise.resolve({
		stdout: mockStdout,
		stderr: mockStderr,
	});
	return Object.assign(result, {
		stdout: mockStdout,
		stderr: mockStderr,
	});
});

describe("ComfyUI", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("should generate model paths config on init", async () => {
		const mockWriteFile = jest.fn();
		(fsp.writeFile as jest.Mock) = mockWriteFile;

		const expectedPath = "/path/to/temporary/comfyui/model_paths.yaml";
		(getCaptainTemporary as jest.Mock).mockReturnValue(expectedPath);

		await ComfyUI.init();

		const expectedConfig = {
			captain: {
				base_path: "/path/to/downloads",
				checkpoints: "stable-diffusion/checkpoints",
			},
		};
		const expectedYAML = stringify(expectedConfig);

		expect(mockWriteFile).toHaveBeenCalledWith(expectedPath, expectedYAML);
		expect(ComfyUI.getInstance).toBeTruthy();
	});

	it("should not be able to initialize twice", async () => {
		const instance = await ComfyUI.init();

		// Try to initialize again
		await ComfyUI.init();

		// Ensure no new instance was created
		expect(ComfyUI.getInstance).toBe(instance);
	});
});

//
// describe("ComfyUI registerClient", () => {
// 	it("should register a new client and setup WebSocket", () => {
// 		const instance = ComfyUI.getInstance;
// 		const mockSetupWebSocket = jest.fn();
// 		instance.setupWebSocket = mockSetupWebSocket;

// 		instance.registerClient("client1", jest.fn());

// 		expect(mockSetupWebSocket).toHaveBeenCalledWith("client1", expect.any(Function));
// 		expect(instance.clients.has("client1")).toBeTruthy();
// 	});

// 	it("should not register a client twice", () => {
// 		const instance = ComfyUI.getInstance;
// 		instance.registerClient("client1", jest.fn());

// 		const mockSetupWebSocket = jest.fn();
// 		instance.setupWebSocket = mockSetupWebSocket;

// 		instance.registerClient("client1", jest.fn());

// 		expect(mockSetupWebSocket).not.toHaveBeenCalled();
// 	});
// });
