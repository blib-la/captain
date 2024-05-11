import { app } from "electron";

import { main } from "./main";

import { registerApps } from "@/electron/app-loaders";
import { gotTheLock } from "@/electron/flags";
import { logger } from "@/electron/services/logger";
import { watchStores } from "@/electron/stores/watchers";
import { cleanFiles } from "@/electron/utils/clean-files";
import { isTest } from "@/shared/flags";

// Import core setup module.
// This ensures the core setup process is executed explicitly, even though it may already be called
// by dependencies.
// The core setup is crucial for configuring the application environment before other modules are
// loaded.
import "@/electron/core-setup";

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
 * Consider migrating to the new event handling approach outlined in "@/electron/ipc/sdk" or "@/electron/ipc/global".
 */
import "@/electron/ipc/listeners";

// Import modules for managing globally accessible functionalities.
// This includes window management tasks such as minimizing, maximizing, or closing windows.
import "@/electron/ipc/global"; // Manages global IPC events, including those related to window actions.

/**
 * @deprecated
 */
import "@/electron/ipc/sdk/global";

// Import SDK module for 3rd party integration.
// This allows external applications to interact with the app through exposed handlers and
// listeners.
import "@/electron/ipc/sdk/comfyui";
import "@/electron/ipc/sdk/story";

// Import install handlers and listeners
import "@/electron/ipc/install";

// Import update handlers
import "@/electron/ipc/update";

// Import testing helpers
import "@/electron/ipc/testing";

// Import the vector store
import "@/electron/ipc/vector-store";

// Import keys
import "@/electron/ipc/keys";

// Import downloads
import "@/electron/ipc/downloads";

// Import marketplace
import "@/electron/ipc/marketplace";

// Import third party apps
import "@/electron/ipc/third-party-apps";

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
}
