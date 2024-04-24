import path from "path";

import {
	CHILD_MESSAGE_FROM_CHILD_KEY,
	CHILD_MESSAGE_FROM_PARENT_KEY,
	CHILD_MESSAGE_TO_CHILD_KEY,
	CHILD_OPEN_KEY,
} from "@captn/utils/constants";
import type { BrowserWindowConstructorOptions } from "electron";
import { app, type BrowserWindow, globalShortcut, ipcMain, screen } from "electron";

import { buildKey } from "#/build-key";
import { ID } from "#/enums";
import type { MultiWindowConfiguration, MultiWindowKey } from "@/app-loaders";
import { appLoaders, isMultiWindow } from "@/app-loaders";
import { apps } from "@/apps";
import logger from "@/services/logger";
import { createWindow } from "@/utils/create-window";
import { loadURL } from "@/utils/load-window";

/**
 * Creates and displays the installer window with predefined dimensions.
 * This window is used during the application's installation or update process.
 * It loads a specific URL that corresponds to the installer interface.
 *
 * @returns {Promise<BrowserWindow>} A promise that resolves to the created BrowserWindow instance for the installer.
 */
export async function createInstallerWindow({
	step = "installer/00",
}: {
	step?: string;
}): Promise<BrowserWindow> {
	const { width, height } = screen.getPrimaryDisplay().workAreaSize;
	const windowWidth = Math.min(600, width);
	const windowHeight = Math.min(700, height);
	const installerWindow = await createWindow("installer", {
		width: windowWidth,
		height: windowHeight,
		minWidth: windowWidth,
		minHeight: windowHeight,
		maxWidth: windowWidth,
		maxHeight: windowHeight,
		frame: false,
	});

	await loadURL(installerWindow, step);
	return installerWindow;
}

/**
 * Creates and manages a prompt window that functions similarly to a spotlight-like search bar.
 * This window is designed to be always available but hidden by default and can be triggered to show
 * via a specific key combination. It hides automatically when it loses focus.
 *
 * The window is non-resizable, transparent, and always on top, ensuring it's visible above all other
 * applications and interfaces. It does not support minimization or maximization to maintain its
 * simplicity and specific functionality.
 *
 * Key bindings:
 * - A global shortcut (Control+Alt+Space) is registered to show the prompt window.
 * - The 'Escape' key is used to hide the window when it is focused.
 *
 * Events:
 * - On 'show': Focuses on the window and registers the 'Escape' key to hide it.
 * - On 'hide': Unregisters the 'Escape' key to prevent unintended interactions when the window is not visible.
 * - On 'focus': Sends a custom IPC message indicating the window is focused.
 * - On 'blur': Automatically hides the window to ensure it only remains visible while active.
 *
 * IPC Events:
 * - Handles custom IPC event for resizing the window based on dynamic content dimensions received from the renderer process.
 *
 * Lifecycle:
 * - On application's 'will-quit' event, unregisters all global shortcuts to clean up resources appropriately.
 *
 * @returns {BrowserWindow} The created prompt window, allowing further manipulation if necessary.
 */
export async function createPromptWindow() {
	logger.info(`createPromptWindow(): started`);
	const window_ = await createWindow("main", {
		width: 750,
		height: 112,
		minWidth: 750,
		maxWidth: 750,
		frame: false,
		alwaysOnTop: true,
		minimizable: false,
		maximizable: false,
		fullscreen: false,
		fullscreenable: false,
		transparent: true,
		resizable: false,
		show: false,
	});
	logger.info(`createPromptWindow(): created main window`);

	await loadURL(window_, "prompt");
	logger.info(`createPromptWindow(): loaded prompt`);

	window_.on("show", () => {
		window_.focus();
		globalShortcut.register("Escape", async () => {
			window_.hide();
		});
	});
	window_.on("hide", () => {
		globalShortcut.unregister("Escape");
	});
	window_.on("focus", () => {
		window_.webContents.send(buildKey([ID.WINDOW], { suffix: ":focus" }));
	});

	window_.on("blur", () => {
		window_.hide();
	});
	logger.info(`createPromptWindow(): added window listener`);

	ipcMain.on(buildKey([ID.WINDOW], { suffix: ":resize" }), (_event, { height, width }) => {
		if (width && height) {
			window_.setResizable(true);
			window_.setSize(750, Math.ceil(height));
			window_.setResizable(false);
		}
	});
	logger.info(`createPromptWindow(): added ipc listener: resize`);

	const promptShortcut = "Control+Alt+Space";
	globalShortcut.register(promptShortcut, async () => {
		window_.show();
	});
	logger.info(`createPromptWindow(): added global shortcut listener`);

	app.on("will-quit", () => {
		// Unregister a shortcut.
		globalShortcut.unregister(promptShortcut);
		globalShortcut.unregister("Escape");

		// Unregister all shortcuts.
		globalShortcut.unregisterAll();
	});
	logger.info(`createPromptWindow(): added app listener: will-quit`);

	return window_;
}

/**
 * Creates a specialized core application window for specific features like live-painting,
 * storytelling, and other non-essential but integral components of Captain. These components
 * utilize the SDK and are hosted within Captain's custom protocol.
 *
 * This function configures a new Electron `BrowserWindow` with a specified set of options, ensuring
 * it adheres to a minimum size requirement. It loads the window with a specific app URL composed of the
 * provided app ID and an optional query string.
 *
 * The window is frameless and utilizes a custom preload script for enhanced functionality, which is specified
 * in the webPreferences.
 *
 * @param {string} id - The unique identifier for the core app component. This ID is used to generate
 *                      the URL and to register the window within the application.
 * @param {string} [query=""] - Optional query string to append to the URL, allowing for dynamic content loading
 *                              based on initial parameters.
 * @param {BrowserWindowConstructorOptions} [options={}] - Optional Electron `BrowserWindow` options to further
 *                                                         customize the window's appearance and behavior. This can
 *                                                         include dimensions, features, and web preferences.
 *
 * @returns {Promise<BrowserWindow>} A promise that resolves to the created `BrowserWindow` instance, allowing
 *                                   for further manipulation and management within the application.
 */
export async function createCoreAppWindow(
	id: string,
	query = "",
	options: BrowserWindowConstructorOptions = {}
) {
	const appWindow = await createWindow(id, {
		minWidth: 800,
		minHeight: 600,
		width: 1200,
		height: 1000,
		frame: false,
		...options,
		webPreferences: {
			...options.webPreferences,
			preload: path.join(__dirname, "app-preload.js"),
		},
	});

	await loadURL(appWindow, `apps/${id}?${query}`);

	return appWindow;
}

/**
 * Creates the core application window for Captain, which includes essential features such as the dashboard,
 * settings, downloads, and the marketplace. This window is a central hub for managing and interacting with
 * core functionalities of the application.
 *
 * The function configures a new Electron `BrowserWindow` with specified options, ensuring it meets minimum
 * size requirements. The window is frameless and uses a specific preload script, enhancing its functionality
 * with additional capabilities specified in the `webPreferences`.
 *
 * @param {BrowserWindowConstructorOptions} [options={}] - Optional Electron `BrowserWindow` options to customize
 *                                                         the window's appearance and behavior. This can include
 *                                                         dimensions, features, and specific web preferences tailored
 *                                                         to enhance the core functionalities of the application.
 *
 * @returns {Promise<BrowserWindow>} A promise that resolves to the newly created `BrowserWindow` instance, allowing
 *                                   for further manipulation and lifecycle management within the application. This
 *                                   window serves as the primary interface for user interaction with the application's
 *                                   central features.
 */
export async function createCoreWindow(options: BrowserWindowConstructorOptions = {}) {
	return createWindow("core", {
		minWidth: 800,
		minHeight: 600,
		width: 1200,
		height: 1000,
		frame: false,
		...options,
		webPreferences: {
			...options.webPreferences,
			preload: path.join(__dirname, "preload.js"),
		},
	});
}

/**
 * Asynchronously creates and opens a new application window for a specified app,
 * loading its content via a custom, namespaced protocol. This function configures
 * a new Electron `BrowserWindow` and initiates content loading based on a predefined
 * loader associated with the app's unique identifier. It sets up the window without
 * a frame and applies additional options provided by the caller.
 *
 * The window's web content is prepared with a specific preload script that can manipulate
 * or interact with the content securely before it fully loads, enhancing functionality
 * and user experience.
 *
 * @param {string} id - The unique identifier for the app, used to determine the content
 *                      loader and to namespace its protocol. This ID is crucial for loading
 *                      the correct app resources and handling them in an isolated manner.
 * @param {BrowserWindowConstructorOptions} [options={}] - Optional configuration options
 *                                                         for customizing the new BrowserWindow instance.
 *                                                         These options can dictate the visual and functional
 *                                                         properties of the window, such as dimensions,
 *                                                         frame visibility, and web preferences.
 * @returns {Promise<BrowserWindow>} A promise that resolves to the created BrowserWindow instance.
 *                                   This promise may reject if there is an issue with loading the
 *                                   app's content, with errors logged to the console.
 */
export async function createAppWindow(
	id: string,
	options: BrowserWindowConstructorOptions = {}
): Promise<BrowserWindow> {
	logger.info(`Created App with ID: ${id} and these options:`, options);
	const appWindow = await createWindow(id, {
		frame: false,
		...options,
		webPreferences: {
			...options.webPreferences,
			preload: path.join(__dirname, "app-preload.js"),
		},
	});

	try {
		await appLoaders[id](appWindow);
	} catch (error) {
		logger.error(`Failed loading window with ID: ${id}`, appLoaders, error);
	}

	return appWindow;
}

/**
 * Opens the core window of the application to a specified page, with an optional action parameter.
 * This function ensures the core window is initialized and visible, loading the designated page within
 * the core section of the application. If provided, the action parameter allows for dynamic interaction
 * with the page, typically influencing how the page behaves or interacts with the main process.
 *
 * The core window is managed as a singleton within the application's lifecycle, ensuring that only one
 * instance exists at a time. If the window is minimized when this function is called, it will be restored
 * and focused to bring it to the user's attention.
 *
 * @param {string} page - The specific page within the core module to navigate to. This should correspond
 *                        to a valid route or file within the core section of your application's architecture.
 * @param {string} [action] - An optional query parameter that can trigger specific functionality on the
 *                            page, enhancing interactivity and providing context-sensitive actions.
 */
export async function openCore(page: string, action?: string) {
	apps.core ||= await createCoreWindow();
	// Add action to the url
	await loadURL(apps.core, `core/${page}${action ? `?action=${action}` : ""}`);
	apps.core.on("close", () => {
		apps.core = null;
	});

	if (apps.core.isMinimized()) {
		apps.core.restore();
	}

	apps.core.focus();
}

/**
 * Manages or initializes an application window for a given third-party app identified by an appId.
 * This function ensures that only one instance of any app window exists by checking if it's already
 * present in the global `apps` object. If the window does not exist, it creates a new one using the
 * specified options. It also sets up an event listener to nullify its reference in the global `apps`
 * object upon closure, ensuring clean up and preventing memory leaks.
 *
 * If the window is found to be minimized when this function is called, it will restore the window
 * to its normal state. This ensures that the app window is visible and accessible to the user
 * immediately after handling.
 *
 * @param {string} appId - The unique identifier for the third-party app. This ID is used to
 *                         store and retrieve the app window from the global `apps` object.
 * @param {BrowserWindowConstructorOptions} options - Configuration options for creating the
 *                                                    app window if it does not already exist.
 *                                                    These options dictate the visual and functional
 *                                                    properties of the window, such as dimensions,
 *                                                    frame visibility, and web preferences.
 *
 * @returns {Promise<BrowserWindow>} Returns a promise that resolves to the app window. This can
 *                                   be used to interact further with the window, such as loading
 *                                   URLs or manipulating window state.
 */

export async function handleAppWindow(appId: string, options: BrowserWindowConstructorOptions) {
	apps[appId] ||= await createAppWindow(appId, options);
	apps[appId]!.on("close", () => {
		apps[appId] = null;
	});
	if (apps[appId]!.isMinimized()) {
		apps[appId]!.restore();
	}

	return apps[appId];
}

/**
 * Manages or initializes a core application window for a specific core app identified by an appId.
 * This function checks if a window for the core app already exists in the global `apps` object. If not,
 * it creates a new one using the provided options and an optional query string constructed from the `query` object.
 * It ensures that only one instance of any core app window exists by managing its lifecycle through the global `apps` object.
 *
 * Upon the window's closure, its reference in the `apps` object is nullified to ensure cleanup and prevent memory leaks.
 * If the window is minimized when this function is called, it will be restored to ensure visibility.
 *
 * @param {string} appId - The unique identifier for the core app, used to store and retrieve the app window
 *                         from the global `apps` object.
 * @param {Record<string, string>} query - An object representing key-value pairs that will be converted
 *                                         to a query string and appended to the window's URL, allowing for
 *                                         dynamic content loading based on provided parameters.
 * @param {BrowserWindowConstructorOptions} options - Configuration options for creating the window if it
 *                                                    does not already exist. These options can specify the
 *                                                    visual and functional properties of the window, such
 *                                                    as dimensions, frame visibility, and web preferences.
 *
 * @returns {Promise<BrowserWindow>} Returns a promise that resolves to the app window. This allows for further
 *                                   interaction with the window, such as loading URLs or manipulating its state.
 */
export async function handleCoreAppWindow(
	appId: string,
	query: Record<string, string>,
	options: BrowserWindowConstructorOptions
) {
	apps[appId] ||= await createCoreAppWindow(
		appId,
		query ? new URLSearchParams(query).toString() : "",
		options
	);
	apps[appId]!.on("close", () => {
		apps[appId] = null;
	});
	if (apps[appId]!.isMinimized()) {
		apps[appId]!.restore();
	}

	return apps[appId];
}

/**
 * Asynchronously creates a multi-window application environment consisting of a main window and multiple child windows.
 * This function identifies the main window configuration from the provided configurations array and then initializes
 * all specified windows accordingly. It also sets up basic IPC (Inter-Process Communication) mechanisms allowing the
 * main window to send messages to child windows and receive messages from them.
 *
 * The function handles dynamic creation of child windows on-demand via specific IPC commands and ensures that communication
 * only occurs with existing, non-destroyed windows. Child windows are linked to the main window as their parent, establishing
 * a structured window hierarchy.
 *
 * @param {Array<{ id: string; options: BrowserWindowConstructorOptions & { route?: string } }>} configurations -
 *        An array of objects where each object contains an 'id' and 'options' for creating a BrowserWindow.
 *        The 'id' should end with '-main-window' for the main window. Optional 'route' in options can specify
 *        initial content to load.
 *
 * @returns {void} This function does not return a value but initializes windows and sets up IPC channels for communication.
 *
 * IPC Events:
 * - CHILD_MESSAGE_FROM_PARENT_KEY: Listens for messages intended for child windows and forwards them appropriately.
 * - CHILD_MESSAGE_TO_CHILD_KEY: Receives messages from child windows and forwards them to the main window if applicable.
 * - CHILD_OPEN_KEY: Handles requests to dynamically open new child windows as specified by the IPC message data. Only
 *   registered windows can be opened
 */
export async function createAppWindows(
	configurations: { id: string; options: BrowserWindowConstructorOptions & { route?: string } }[]
) {
	const mainWindowConfiguration = configurations.find(({ id }) => id.endsWith("-main-window"));
	const childConfigurations = configurations.filter(({ id }) => !id.endsWith("-main-window"));
	const childWindows: Record<string, BrowserWindow | null> = {};
	if (!mainWindowConfiguration) {
		logger.error("missing mainWindowConfiguration", configurations);
		return;
	}

	const mainWindow = await handleAppWindow(
		mainWindowConfiguration.id,
		mainWindowConfiguration.options
	);

	if (!mainWindow) {
		logger.error("missing main-window", mainWindowConfiguration.id);
		return;
	}

	ipcMain.on(
		CHILD_MESSAGE_FROM_PARENT_KEY,
		(_event, data: { childId: string; message: string }) => {
			const childWindow = childWindows[data.childId];
			if (childWindow && !childWindow.isDestroyed()) {
				childWindow.webContents.send(CHILD_MESSAGE_FROM_PARENT_KEY, {
					payload: { message: data.message },
				});
			}
		}
	);
	ipcMain.on(
		CHILD_MESSAGE_TO_CHILD_KEY,
		(_event, data: { parentId: string; message: string }) => {
			if (mainWindowConfiguration.id === data.parentId && !mainWindow.isMinimized()) {
				mainWindow.webContents.send(CHILD_MESSAGE_FROM_CHILD_KEY, {
					payload: { message: data.message },
				});
			}
		}
	);
	ipcMain.on(CHILD_OPEN_KEY, async (_event, data: { childId: string; message: string }) => {
		const childConfiguration = childConfigurations.find(({ id }) => id === data.childId);
		if (childConfiguration) {
			childWindows[childConfiguration.id] = await handleAppWindow(childConfiguration.id, {
				...childConfiguration.options,
				parent: mainWindow,
			});
		}
	});

	for (const configuration of childConfigurations) {
		childWindows[configuration.id] = await handleAppWindow(configuration.id, {
			...configuration.options,
			parent: mainWindow,
		});
	}
}

/**
 * Opens an application identified by the appId. This function supports both single-window and multi-window configurations,
 * dynamically handling the creation of these windows based on the options provided.
 *
 * If the 'options' parameter indicates a multi-window configuration (as determined by the 'isMultiWindow' function),
 * it initializes multiple windows each with its specific configuration. These configurations are extracted based on keys
 * ending with '-window'. Otherwise, it handles a single-window setup.
 *
 * The function operates asynchronously, ensuring all necessary windows are opened and configured before completing.
 *
 * @param {string} appId - The unique identifier for the application. This ID is used as a base for creating window IDs
 *                         in multi-window configurations.
 * @param {Object} [payload={}] - An object containing optional settings for opening the application:
 *   @param {Record<string, string>} [query] - Optional query parameters, not used directly in this function but can be
 *                                             passed to window initialization functions.
 *   @param {BrowserWindowConstructorOptions | MultiWindowConfiguration} [options={}] - Configuration options for the window.
 *            This can either be a single set of BrowserWindowConstructorOptions for a single window or a MultiWindowConfiguration
 *            object containing multiple configurations.
 *
 * @returns {Promise<void>} A promise that resolves when all windows are successfully opened and configured.
 */
export async function openApp(
	appId: string,
	{
		options = {},
	}: {
		query?: Record<string, string>;
		options?: BrowserWindowConstructorOptions | MultiWindowConfiguration;
	} = {}
) {
	if (isMultiWindow(options)) {
		const configurations: {
			id: string;
			options: BrowserWindowConstructorOptions & { route?: string };
		}[] = [];
		for (const key in options) {
			if (Object.hasOwn(options, key) && key.endsWith("-window")) {
				configurations.push({
					id: `${appId}-${key}`,
					options: options[key as MultiWindowKey],
				});
			}
		}

		await createAppWindows(configurations);
	} else {
		await handleAppWindow(appId, options);
	}
}

/**
 * Opens a preview application for viewing a specific file, allowing for multiple instances
 * of the preview app to run concurrently with different contents. Each instance is uniquely
 * identified using a file ID provided in the query. If an instance of the preview app for the
 * specified file is already open, it will restore and focus that window instead of opening a new one.
 *
 * This function ensures that each preview instance is managed separately, using a scoped identifier
 * based on the file ID, which helps in tracking and managing multiple instances effectively.
 *
 * @param {Record<string, string>} [query] - Contains the necessary parameters to identify and load the
 *                                           content in the preview app. Must include an 'id' key representing
 *                                           the unique identifier of the file to preview. If the 'id' is not
 *                                           provided, the function logs an error and exits without opening a
 *                                           new window.
 *
 * @returns {Promise<void>} - A promise that resolves when the preview app is opened, focused, or restored.
 *                            The function does not return any value but performs asynchronous operations
 *                            to manage the application windows.
 */
export async function openPreviewApp(query?: Record<string, string>) {
	if (!query?.id) {
		logger.error("Missing query.id when attempting to open the preview app");
		return;
	}

	const scopeId = `preview:${query.id ?? ""}`;
	apps[scopeId] ||= await createCoreAppWindow(
		"preview",
		new URLSearchParams(query ?? {}).toString()
	);
	apps[scopeId]!.on("close", () => {
		apps[scopeId] = null;
	});
	if (apps[scopeId]!.isMinimized()) {
		apps[scopeId]!.restore();
	}

	apps[scopeId]!.focus();
}
