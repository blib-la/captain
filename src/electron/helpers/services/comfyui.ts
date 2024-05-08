import fsp from "node:fs/promises";

import axios from "axios";
import { execa, type ExecaChildProcess } from "execa";
import WebSocket from "ws";
import { stringify } from "yaml";

import { logError, logger } from "@/electron/services/logger";
import { createDirectory } from "@/electron/utils/fs";
import {
	getCaptainData,
	getCaptainDownloads,
	getCaptainTemporary,
} from "@/electron/utils/path-helpers";
import type { NodeChain, QueueWorkflowResponse } from "@/shared/types/comfyui";

type SystemStats = {
	system: {
		os: string;
		python_version: string;
		embedded_python: boolean;
	};
	devices: Device[];
};

type Device = {
	name: string;
	type: string;
	index: number;
	vram_total: number;
	vram_free: number;
	torch_vram_total: number;
	torch_vram_free: number;
};

export type WebSocketMessageHandler = (data: string) => void;

export enum ComfyUIStatus {
	NOT_RUNNING = "NOT_RUNNING",
	RUNNING = "RUNNING",
	FAILED_TO_START = "FAILED_TO_START",
}

/**
 * Manages the lifecycle and interactions of the ComfyUI server, including
 * initiating server processes, managing WebSocket connections for clients,
 * and handling workflow queueing and system status checks.
 */
export class ComfyUI {
	private static instance: ComfyUI | null = null;
	private process: ExecaChildProcess<string> | undefined;
	private url: string;
	private host: string;
	private port: number;
	private clients: Map<string, WebSocket> = new Map();
	private status: ComfyUIStatus = ComfyUIStatus.NOT_RUNNING;
	private debug: boolean = false;

	private constructor(host: string, port: number) {
		this.host = host;
		this.port = port;
		this.url = `${this.host}:${this.port}`;
	}

	/**
	 * Initializes the ComfyUI service as a singleton instance.
	 * This method configures the server, checks its readiness, and starts it if not already running.
	 *
	 * @param {object} options - Configuration options for initializing ComfyUI.
	 * @param {number} [options.timeout=2000] - The timeout in milliseconds for checking server readiness.
	 * @param {number} [options.maxRetries=60] - The maximum number of retries for checking server readiness.
	 * @param {boolean} [options.debug=false] - Enables or disables debug logging.
	 * @param {string} [options.host="127.0.0.1"] - The host address of the ComfyUI server.
	 * @param {number} [options.port=1337] - The port of the ComfyUI server.
	 *
	 * @returns {Promise<ComfyUIStatus>} The status of the ComfyUI server.
	 *
	 * @throws {Error} Throws an error if the server fails to start or is not ready after maximum retries.
	 */
	public static async init({
		timeout = 2000,
		maxRetries = 60,
		debug = false,
		host = "127.0.0.1",
		port = 1337,
	}: {
		timeout?: number;
		maxRetries?: number;
		debug?: boolean;
		host?: string;
		port?: number;
	}): Promise<ComfyUIStatus> {
		if (!ComfyUI.instance) {
			ComfyUI.instance = new ComfyUI(host, port);

			// Enable / disable debugging output
			ComfyUI.instance.debug = debug;

			// Create the config to find the local models of the user
			await ComfyUI.instance.generateModelPathsConfig();

			// Start the ComfyUI server
			await ComfyUI.instance.start();

			// Make sure that the ComfyUI server is started
			const isReady = await ComfyUI.instance.checkServerReady(timeout, maxRetries);

			// The server is started
			if (isReady) {
				logger.info("ComfyUI is ready");
				ComfyUI.instance.status = ComfyUIStatus.RUNNING;
			} else {
				logger.error(`ComfyUI is not ready after maximum retries`);
				ComfyUI.instance.status = ComfyUIStatus.FAILED_TO_START;
			}
		}

		return ComfyUI.instance.status;
	}

	/**
	 * Generates and writes the model paths configuration file required by the ComfyUI server.
	 *
	 * @private
	 */
	private async generateModelPathsConfig() {
		const config = {
			captain: {
				base_path: getCaptainDownloads(),
				checkpoints: "stable-diffusion/checkpoints",
			},
		};

		const configYaml = stringify(config);

		createDirectory(getCaptainTemporary("comfyui"));
		const filePath = getCaptainTemporary("comfyui/model_paths.yaml");

		await fsp.writeFile(filePath, configYaml);
	}

	/**
	 * Starts the ComfyUI server using external Python scripts.
	 * It sets up necessary parameters and handles the process lifecycle.
	 *
	 * @private
	 * @throws {Error} Logs and throws an error if the server process encounters issues.
	 */
	private start() {
		const pythonBinaryPath = getCaptainDownloads("comfyui-portable/python_embeded/python.exe");
		const scriptPath = getCaptainDownloads("comfyui-portable/ComfyUI/main.py");
		const modelPaths = getCaptainTemporary("comfyui/model_paths.yaml");
		const outputPath = getCaptainData("files/comfyui");

		createDirectory(outputPath);

		const scriptArguments = [
			"--listen",
			this.host,
			"--port",
			this.port,
			"--disable-auto-launch",
			"--extra-model-paths-config",
			modelPaths,
			"--output-directory",
			outputPath,
		];

		// Start ComfyUI process
		this.process = execa(pythonBinaryPath, ["-u", scriptPath, ...scriptArguments]);

		// Listen for stdout and stderr
		if (this.debug && this.process.stdout && this.process.stderr) {
			this.process.stdout.on("data", (data: ArrayBuffer) => {
				logger.info(data.toString());
			});

			this.process.stderr.on("data", (data: ArrayBuffer) => {
				logger.info(data.toString());
			});
		}
	}

	/**
	 * Checks if the ComfyUI server is ready to handle requests by querying the system stats endpoint.
	 * It retries the check until it reaches the maximum number of retries.
	 *
	 * @param {number} timeout - The initial timeout for retrying the readiness check.
	 * @param {number} maxRetries - The maximum number of retries for checking server readiness.
	 * @returns {Promise<boolean>} True if the server is ready, false otherwise.
	 */
	private async checkServerReady(timeout: number, maxRetries: number): Promise<boolean> {
		let retries = 0;
		while (retries < maxRetries) {
			try {
				const response = await axios.get<SystemStats>(`http://${this.url}/system_stats`);

				if (response.status === 200) {
					return true;
				}
			} catch {
				retries++;
				await new Promise(resolve => {
					setTimeout(resolve, timeout);
				});
			}
		}

		logger.error(`ComfyUI is not ready after ${maxRetries} retries`);

		return false;
	}

	/**
	 * Sets up a WebSocket connection for a given client ID and attaches message handling.
	 * It manages the lifecycle events of the WebSocket connection including opening, messages, closing, and errors.
	 *
	 * @param {string} clientId - The unique identifier for the client.
	 * @param {WebSocketMessageHandler} handleMessage - The function to call when a message is received on the WebSocket.
	 * @private
	 */
	private setupWebSocket(clientId: string, handleMessage: WebSocketMessageHandler) {
		const webSocket = new WebSocket(`ws://${this.url}/ws?clientId=${clientId}`);

		webSocket.on("open", () => {
			logger.info("WebSocket connection established", clientId);
		});

		webSocket.on("message", data => {
			handleMessage(JSON.parse(data.toString()));
		});

		webSocket.on("close", () => {
			logger.info("WebSocket connection closed", clientId);
		});

		webSocket.on("error", error => {
			logError(error, `WebSocket error for ${clientId}`);
		});

		this.clients.set(clientId, webSocket);
	}

	/**
	 * Registers a new client for WebSocket communications, setting up a new WebSocket connection
	 * if one does not already exist for the given client ID.
	 *
	 * @param {string} clientId - The unique identifier for the client.
	 * @param {WebSocketMessageHandler} handleMessage - The function to handle incoming WebSocket messages.
	 */
	public registerClient(clientId: string, handleMessage: WebSocketMessageHandler) {
		if (this.clients.has(clientId)) {
			logger.info(`Client ${clientId} is already registered.`);
		} else {
			this.setupWebSocket(clientId, handleMessage);
		}
	}

	/**
	 * Unregisters a client by closing its WebSocket connection and removing it from the internal client list.
	 * If the client does not exist, it returns an indication of non-existence.
	 *
	 * @param {string} clientId - The unique identifier of the client to unregister.
	 * @returns {{ closed?: boolean; notExist?: boolean }} An object indicating whether the client was closed or did not exist.
	 */
	public unregisterClient(clientId: string) {
		if (this.clients.has(clientId)) {
			this.clients.get(clientId)?.close();
			this.clients.delete(clientId);

			return { closed: true };
		}

		return { notExist: true };
	}

	/**
	 * Queues a new workflow for processing by the ComfyUI server.
	 *
	 * @param {object} prompt - The workflow data to be processed.
	 * @param {string} clientId - The client ID associated with this request.
	 * @returns {Promise<QueueWorkflowResponse>} The response from the server including prompt ID and any node errors.
	 * @throws {Error} Throws an error if the request to queue the workflow fails.
	 */
	public async queueWorkflow(
		prompt: NodeChain,
		clientId: string
	): Promise<QueueWorkflowResponse> {
		const url = `http://${this.url}/prompt`;
		try {
			const response = await axios.post(url, { prompt, client_id: clientId });
			const { node_errors, number, prompt_id } = response.data;

			return {
				promptId: prompt_id,
				node_errors,
				number,
			};
		} catch (error) {
			logError(error, "Can't queue the workflow for ComfyUI");
			throw error;
		}
	}

	/**
	 * Retrieves the singleton instance of the ComfyUI class.
	 *
	 * @returns {ComfyUI} The singleton instance.
	 * @throws {Error} Throws an error if the singleton has not been initialized before calling this getter.
	 */
	public static get getInstance(): ComfyUI {
		if (!ComfyUI.instance) {
			throw new Error("ComfyUI instance has not been initialized. Please call 'init' first.");
		}

		return ComfyUI.instance;
	}
}
