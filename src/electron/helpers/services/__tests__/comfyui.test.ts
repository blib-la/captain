import fsp from "node:fs/promises";
import { PassThrough } from "stream";

import axios from "axios";
import { execa } from "execa";
import WebSocket from "ws";
import { stringify } from "yaml";

import type { WebSocketMessageHandler } from "@/electron/services/comfyui";
import { ComfyUI, ComfyUIStatus } from "@/electron/services/comfyui";
import { logError, logger } from "@/electron/services/logger";
import { getCaptainTemporary } from "@/electron/utils/path-helpers";
import type { NodeChain, QueueWorkflowResponse } from "@/shared/types/comfyui";

jest.mock("axios");
jest.mock("execa");
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

const mockWebSocket = {
	on: jest.fn((event, callback) => {
		mockWebSocket._events[event] = callback;
	}),
	send: jest.fn(),
	close: jest.fn(),
	// eslint-disable-next-line @typescript-eslint/ban-types
	_events: {} as Record<string, Function>,
	triggerEvent(event: string, ...arguments_: unknown[]) {
		if (typeof this._events[event] === "function") {
			this._events[event](...arguments_);
		}
	},
};

jest.mock("ws", () => jest.fn(() => mockWebSocket));

describe("ComfyUI", () => {
	const port = 1234;

	const workflow: NodeChain = {
		"3": {
			inputs: {
				seed: 416_138_702_284_529,
			},
			class_type: "test",
		},
	};

	beforeEach(() => {
		jest.clearAllMocks();
		ComfyUI.instance = null;
	});

	it("should return an error if no instance exists", () => {
		try {
			const _instance = ComfyUI.getInstance;
		} catch (error) {
			expect(error).toBeDefined();

			expect((error as Error).message).toContain(`ComfyUI instance has not been initialized`);
		}
	});

	it("should generate model paths config on init", async () => {
		const mockWriteFile = jest.fn();
		(fsp.writeFile as jest.Mock) = mockWriteFile;

		const expectedPath = "/path/to/temporary/comfyui/model_paths.yaml";
		(getCaptainTemporary as jest.Mock).mockReturnValue(expectedPath);

		await ComfyUI.init({});

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
		await ComfyUI.init({});
		const instance = ComfyUI.getInstance;

		// Try to initialize again
		await ComfyUI.init({});

		// Ensure no new instance was created
		expect(ComfyUI.getInstance).toBe(instance);
	});

	it("should be ready when init worked fine", async () => {
		const status = await ComfyUI.init({});

		expect(status).toBe(ComfyUIStatus.RUNNING);
	});

	it("should be not ready when init didn't work", async () => {
		(axios.get as jest.Mock).mockImplementationOnce((url: string) => {
			if (url.includes("/system_stats")) {
				return Promise.reject(new Error("Server not reachable"));
			}

			return Promise.reject(new Error("not found"));
		});

		const status = await ComfyUI.init({ timeout: 1, maxRetries: 1 });

		expect(status).toBe(ComfyUIStatus.FAILED_TO_START);
	});

	it("should set up WebSocket with correct event handlers", async () => {
		await ComfyUI.init({ port });
		const instance = ComfyUI.getInstance;

		// Prepare test data
		const clientId = "test-client";
		const handleMessage: WebSocketMessageHandler = jest.fn();

		// Call setupWebSocket
		instance.setupWebSocket(clientId, handleMessage);

		// Verify WebSocket instance creation
		expect(WebSocket).toHaveBeenCalledWith(`ws://127.0.0.1:${port}/ws?clientId=${clientId}`);

		expect(mockWebSocket.on).toHaveBeenCalledWith("open", expect.any(Function));

		// Check event handlers
		expect(mockWebSocket.on).toHaveBeenNthCalledWith(1, "open", expect.any(Function));
		expect(mockWebSocket.on).toHaveBeenNthCalledWith(2, "message", expect.any(Function));
		expect(mockWebSocket.on).toHaveBeenNthCalledWith(3, "close", expect.any(Function));
		expect(mockWebSocket.on).toHaveBeenNthCalledWith(4, "error", expect.any(Function));

		// Simulate "open" event
		const openHandler = (mockWebSocket.on as jest.Mock).mock.calls[0][1];
		openHandler();
		expect(logger.info).toHaveBeenCalledWith("WebSocket connection established", clientId);

		// Simulate "message" event
		const messageHandler = (mockWebSocket.on as jest.Mock).mock.calls[1][1];
		messageHandler(JSON.stringify({ key: "value" }));
		expect(handleMessage).toHaveBeenCalledWith({ key: "value" });

		// Simulate "close" event
		const closeHandler = (mockWebSocket.on as jest.Mock).mock.calls[2][1];
		closeHandler();
		expect(logger.info).toHaveBeenCalledWith("WebSocket connection closed", clientId);

		// Simulate "error" event
		const errorHandler = (mockWebSocket.on as jest.Mock).mock.calls[3][1];
		const testError = new Error("WebSocket Error");
		errorHandler(testError);
		expect(logError).toHaveBeenCalledWith(testError, `WebSocket error for ${clientId}`);

		// Ensure client ID is added to the clients map
		expect(instance.clients.has(clientId)).toBe(true);
	});

	it("should not set up WebSocket if the client is already registered", async () => {
		await ComfyUI.init({});
		const instance = ComfyUI.getInstance;

		// Prepare test data
		const clientId = "test-client";
		const handleMessage: WebSocketMessageHandler = jest.fn();

		// Mock `setupWebSocket` method to avoid testing its internals
		const setupWebSocketSpy = jest
			.spyOn(instance, "setupWebSocket")
			.mockImplementation(jest.fn());

		// Add client to the map directly to simulate an existing client
		instance.clients.set(clientId, mockWebSocket as unknown as WebSocket);

		// Register client
		instance.registerClient(clientId, handleMessage);

		// Verify WebSocket is not set up again
		expect(setupWebSocketSpy).not.toHaveBeenCalled();
		expect(mockWebSocket.on).not.toHaveBeenCalled();

		// Cleanup
		setupWebSocketSpy.mockRestore();
	});

	it("should set up WebSocket if the client is not already registered", async () => {
		await ComfyUI.init({});
		const instance = ComfyUI.getInstance;

		// Prepare test data
		const clientId = "new-client";
		const handleMessage: WebSocketMessageHandler = jest.fn();

		// Mock `setupWebSocket` method to verify it's called
		const setupWebSocketSpy = jest
			.spyOn(instance, "setupWebSocket")
			.mockImplementation(jest.fn());

		// Register new client
		instance.registerClient(clientId, handleMessage);

		// Verify WebSocket setup is triggered
		expect(setupWebSocketSpy).toHaveBeenCalledWith(clientId, handleMessage);

		// Cleanup
		setupWebSocketSpy.mockRestore();
	});

	it("should close WebSocket and remove client if the client is registered", async () => {
		await ComfyUI.init({});
		const instance = ComfyUI.getInstance;

		// Prepare test data
		const clientId = "existing-client";

		// Mock `setupWebSocket` method to avoid testing its internals
		const setupWebSocketSpy = jest
			.spyOn(instance, "setupWebSocket")
			.mockImplementation(jest.fn());

		// Add a client to the map directly to simulate an existing client
		instance.clients.set(clientId, mockWebSocket as unknown as WebSocket);

		// Unregister client
		const result = instance.unregisterClient(clientId);

		// Verify WebSocket is closed and client is removed
		expect(mockWebSocket.close).toHaveBeenCalled();
		expect(instance.clients.has(clientId)).toBe(false);
		expect(result).toEqual({ closed: true });

		// Cleanup
		setupWebSocketSpy.mockRestore();
	});

	it("should return notExist if the client is not registered", async () => {
		await ComfyUI.init({});
		const instance = ComfyUI.getInstance;

		// Prepare test data
		const clientId = "non-existing-client";

		// Unregister non-existing client
		const result = instance.unregisterClient(clientId);

		// Verify WebSocket is not closed and client is not removed
		expect(mockWebSocket.close).not.toHaveBeenCalled();
		expect(instance.clients.has(clientId)).toBe(false);
		expect(result).toEqual({ notExist: true });
	});

	it("should queue a workflow successfully and return the response", async () => {
		const mockedAxios = axios as jest.Mocked<typeof axios>;

		await ComfyUI.init({ port });
		const instance = ComfyUI.getInstance;

		// Prepare test data
		const clientId = "test-client";
		const mockResponseData = {
			node_errors: [],
			number: 1,
			prompt_id: "prompt-123",
		};

		// Mock axios POST response
		mockedAxios.post.mockResolvedValueOnce({ data: mockResponseData });

		// Expected QueueWorkflowResponse
		const expectedResponse: QueueWorkflowResponse = {
			node_errors: [],
			number: 1,
			promptId: "prompt-123",
		};

		// Queue workflow and verify response
		const result = await instance.queueWorkflow(workflow, clientId);
		expect(result).toEqual(expectedResponse);

		// Verify axios was called with correct arguments
		expect(mockedAxios.post).toHaveBeenCalledWith(`http://127.0.0.1:${port}/prompt`, {
			prompt: workflow,
			client_id: clientId,
		});
	});

	it("should correctly free resources based on the provided options", async () => {
		const mockedAxios = axios as jest.Mocked<typeof axios>;
		await ComfyUI.init({ port });
		const instance = ComfyUI.getInstance;

		// Mock axios POST response for the free method
		mockedAxios.post.mockResolvedValueOnce({ status: 200 });
		const unloadModels = true;
		const freeMemory = true;

		// Call the free method and store the result
		const result = await instance.free({ unloadModels, freeMemory });

		// Verify that the free method returns true when the operation is successful
		expect(result).toBe(true);

		// Verify axios was called with correct arguments
		expect(mockedAxios.post).toHaveBeenCalledWith(`http://127.0.0.1:${port}/free`, {
			unload_models: unloadModels,
			free_memory: freeMemory,
		});

		// Test the failure case
		mockedAxios.post.mockRejectedValueOnce(new Error("Freeing resources failed"));
		const failedResult = await instance.free({ unloadModels, freeMemory });

		// Verify that the free method returns false when the operation fails
		expect(failedResult).toBe(false);
		expect(logError).toHaveBeenCalledWith(expect.any(Error), "comfyUI free failed");
	});

	it("should throw an error if the workflow queuing fails", async () => {
		const mockedAxios = axios as jest.Mocked<typeof axios>;

		await ComfyUI.init({ port });
		const instance = ComfyUI.getInstance;

		// Prepare test data
		const clientId = "test-client";
		const errorMessage = "Can't queue the workflow for ComfyUI";

		// Mock axios POST response to reject
		mockedAxios.post.mockRejectedValueOnce(new Error(errorMessage));

		// Try to queue workflow and catch error
		await expect(instance.queueWorkflow(workflow, clientId)).rejects.toThrow(errorMessage);

		// Verify axios was called with correct arguments
		expect(mockedAxios.post).toHaveBeenCalledWith(`http://127.0.0.1:${port}/prompt`, {
			prompt: workflow,
			client_id: clientId,
		});
	});

	it("should upload an image successfully", async () => {
		// Mock axios to resolve the POST request
		const mockedAxios = axios as jest.Mocked<typeof axios>;
		mockedAxios.post.mockResolvedValue({ status: 200 });
		await ComfyUI.init({ port });
		const instance = ComfyUI.getInstance;
		const appId = "testApp";
		const blob = new Blob(["image data"], { type: "image/png" });

		// Execute the uploadImage method
		await expect(instance.uploadImage(appId, blob)).resolves.toBeUndefined();

		// Expect axios.post to have been called once
		expect(mockedAxios.post).toHaveBeenCalledTimes(1);

		// Check the FormData instance passed to axios.post
		const formData = mockedAxios.post.mock.calls[0][1] as FormData;
		expect(formData).toBeInstanceOf(FormData);
		// Expect(formData.getHeaders()["content-type"]).toContain("multipart/form-data");

		// Check the correct endpoint was called
		expect(mockedAxios.post).toHaveBeenCalledWith(
			`http://127.0.0.1:${port}/upload/image`,
			expect.any(FormData)
		);
	});

	it("should log an error if the upload fails", async () => {
		// Mock axios to reject the POST request
		const mockedAxios = axios as jest.Mocked<typeof axios>;
		const error = new Error("Upload failed");
		mockedAxios.post.mockRejectedValue(error);
		await ComfyUI.init({ port });
		const instance = ComfyUI.getInstance;
		const appId = "testApp";
		const blob = new Blob(["image data"], { type: "image/png" });

		// Execute the uploadImage method and expect it to throw
		await expect(instance.uploadImage(appId, blob)).rejects.toThrow("Upload failed");

		// Check that the error was logged using logError (assuming logError is also mocked correctly)
		expect(logError).toHaveBeenCalledWith(error);

		// Expect axios.post to have been called once
		expect(mockedAxios.post).toHaveBeenCalledTimes(1);
	});

	it("should correctly append blob and metadata to FormData", async () => {
		const mockedAxios = axios as jest.Mocked<typeof axios>;
		await ComfyUI.init({ port });
		const instance = ComfyUI.getInstance;
		// Prepare a mock for FormData
		const appendSpy = jest.spyOn(FormData.prototype, "append");

		const appId = "testApp";
		const blob = new Blob(["image data"], { type: "image/png" });

		// Since we're only testing FormData handling, we can resolve the POST request
		mockedAxios.post.mockResolvedValue({ status: 200 });

		// Execute the uploadImage method
		await instance.uploadImage(appId, blob);

		// Check if FormData was correctly used
		expect(appendSpy).toHaveBeenCalledWith("image", blob, `${appId}.png`);
		expect(appendSpy).toHaveBeenCalledWith("overwrite", "true");

		// Cleanup spy
		appendSpy.mockRestore();
	});
});
