import { app } from "electron";

import { isTest } from "#/flags";
import { registerApps } from "@/app-loaders";
import { main } from "@/main";
import logger from "@/services/logger";
import { watchStores } from "@/stores/watchers";
import { cleanFiles } from "@/utils/clean-files";

// Import core setup module.
// This ensures the core setup process is executed explicitly, even though it may already be called
// by dependencies.
// The core setup is crucial for configuring the application environment before other modules are
// loaded.
import "@/core-setup";

// Deprecated IPC Modules
// Warning: The IPC handlers and listeners imported below are considered deprecated.
// They are included here for backward compatibility with older versions of the application or for
// specific legacy features.
// It's important to avoid using these for new development, as they may be removed in future
// releases.

// If your feature requires IPC communication, refer to the updated IPC modules and documentation
// for the recommended practices.
// Note: If migration to the new modules is not immediately feasible, ensure to document the usage
// of deprecated modules within your codebase to plan for future refactoring.

/**
 * @deprecated Handles legacy IPC event listeners
 * Consider migrating to the new event handling approach outlined in "@/ipc/sdk" or "@/ipc/global".
 */
import "@/ipc/listeners";

/**
 * @deprecated Manages IPC for outdated storytelling or narrative-driven interactions.
 * Consider migrating to the new event handling approach outlined in "@/ipc/sdk" or "@/ipc/global".
 */
import "@/ipc/story";

// Import modules for managing globally accessible functionalities.
// This includes window management tasks such as minimizing, maximizing, or closing windows.
import "@/ipc/global"; // Manages global IPC events, including those related to window actions.

// Import SDK module for 3rd party integration.
// This allows external applications to interact with the app through exposed handlers and
// listeners.
import "@/ipc/sdk";
import "@/ipc/sdk/text-to-image";

// Import install handlers and listeners
import "@/ipc/install";

// Import testing helpers
import "@/ipc/testing";

// Import the vector store
import "@/ipc/vector-store";

// Import keys
import "@/ipc/keys";

// Import downloads
import "@/ipc/downloads";

// Obtain a lock to check if the app is locked (primary instance)
// If false, we close the app, as we want to prevent multiple instances of our app
// https://github.com/electron/electron/blob/v30.0.0-nightly.20240221/docs/api/app.md#apprequestsingleinstancelockadditionaldata
const gotTheLock = app.requestSingleInstanceLock();

let unsubscribe: (() => Promise<void>) | undefined;

if (gotTheLock || isTest) {
	// Register user installed apps
	registerApps();

	main().then(() => {
		logger.info("Application started successfully");
		unsubscribe = watchStores();
	});

	// Listen for the 'window-all-closed' event on the Electron app object.
	// This event is emitted when all windows of the application have been closed.
	// In response, quit the application to free up resources, adhering to typical desktop application
	// behavior.
	app.on("window-all-closed", async () => {
		app.quit();

		// Clean all temporary files
		await cleanFiles();

		if (unsubscribe) {
			await unsubscribe();
		}
	});
} else {
	// The app is locked, so we force quit the new instance
	console.log("App is locked by another instance. Closing app");
	app.quit();

	if (unsubscribe) {
		unsubscribe();
	}
}
