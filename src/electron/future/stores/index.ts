import Store from "electron-store";

import { buildKey } from "#/build-key";
import { KEY } from "#/enums";
import type {
	DownloadsSettings,
	InventorySettings,
	KeysSettings,
	MarketplaceSettings,
	UserSettings,
} from "@/types";

// Ensure that core settings are loaded before the stores are instantiated.
import "@/core-setup";

/**
 * `userStore` is dedicated to storing user preferences and settings, encapsulated within the `UserSettings` interface.
 * This separation allows for focused management of user-specific data, isolating it from application-wide or other domain-specific data.
 * Utilizing a distinct store for user preferences facilitates easier access, updates, and potentially user-specific encryption or access control
 * mechanisms in the future.
 */
export const userStore = new Store<UserSettings>({ name: buildKey([KEY.STORE, KEY.USER]) });

/**
 * The `marketplaceStore` is dedicated to persisting data about marketplace items that have been retrieved,
 * typically through a manual refresh operation initiated by the user. This store is crucial for handling
 * the dynamic and potentially large dataset associated with marketplace offerings, including descriptions,
 * pricing, and availability. By segregating marketplace data, the application can more efficiently manage
 * updates and access to this information, facilitating a smoother user experience and enabling effective
 * caching strategies. This store is only updated when the user explicitly requests new data, ensuring
 * that the application works with the most current information without unnecessary data fetching.
 */
export const marketplaceStore = new Store<MarketplaceSettings>({
	name: buildKey([KEY.STORE, KEY.MARKETPLACE]),
});

/**
 * The `downloadsStore` serves as a central repository for tracking the progress and status of all downloads
 * within the application. This includes ongoing download activities, completed downloads, and any errors or
 * interruptions that may occur. By maintaining a dedicated store for download information, the application
 * can provide users with real-time feedback on download progress, troubleshoot issues related to specific
 * downloads, and manage the overall download workflow. This store plays a critical role in ensuring a robust
 * and user-friendly download experience, allowing for precise control and monitoring of all download-related
 * activities.
 */
export const downloadsStore = new Store<DownloadsSettings>({
	name: buildKey([KEY.STORE, KEY.DOWNLOADS]),
});

/**
 * The `inventoryStore` is tasked with keeping a comprehensive record of all items that are either
 * installed/downloaded through the marketplace or manually added by the user. It acts as a catalog
 * of the user's collection, facilitating easy access to and management of their assets. This store
 * helps in organizing the items based on various criteria such as installation status, usage frequency,
 * or custom tags defined by the user. By providing a detailed and easily navigable inventory, the
 * application enhances user engagement and utility, enabling users to efficiently manage their
 * resources and integrate them into their workflows. The inventory store is a pivotal component
 * in bridging the gap between acquisition (via downloads) and utilization of marketplace items.
 */
export const inventoryStore = new Store<InventorySettings>({
	name: buildKey([KEY.STORE, KEY.INVENTORY]),
	watch: true,
});

/**
 * The `keyStore` is specifically tailored for the secure handling of sensitive data, like API keys,
 * by employing the `encryptionKey` feature of `electron-store`. This encryption acts primarily as an
 * obfuscation tool, designed to deter direct manual edits or unintended disclosures of the contents,
 * rather than providing a foolproof security measure. It effectively makes the sensitive data less
 * accessible to casual browsing or accidental exposure, ensuring that API keys and similar sensitive
 * information are stored in a manner that reduces the risk of them being compromised through simple
 * file inspection or inadvertent sharing.
 */
export const keyStore = new Store<KeysSettings>({
	name: buildKey([KEY.STORE, KEY.KEYS]),
	encryptionKey: KEY.KEYS, // Using "KEYS" enum as an encryption key for obfuscation purposes.
});

/**
 * The `appSettingsStore` is designed to manage app-specific configurations and states,
 * such as tracking the version of an embedded Python installation and monitoring the
 * setup progress. This store facilitates the verification of whether the app is
 * correctly set up for the current version and if all core installation mechanisms
 * were successful. By maintaining a dedicated store for these app-specific settings,
 * the application can ensure that it is properly initialized and ready for use,
 * enhancing reliability and user experience.
 */
export const appSettingsStore = new Store({
	name: buildKey([KEY.STORE, KEY.APP]),
});
