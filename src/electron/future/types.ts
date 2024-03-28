import type { DownloadState } from "@captn/utils/constants";

/**
 * Primary settings necessary for basic application functionality and user accessibility.
 */
export interface UserPrimarySettings {
	/**
	 * User's preferred language. Should be a valid IETF language tag (e.g., "en-US", "fr-FR").
	 */
	language: string;

	/**
	 * User's preferred theme. Supports "light", "dark", or "system" for automatic matching.
	 */
	theme: "light" | "dark" | "system";

	/**
	 * Privacy settings, including data collection and sharing preferences.
	 */
	privacySettings: {
		/**
		 * Indicates whether the user consents to data collection for analytics.
		 */
		analyticsConsent: boolean;

		/**
		 * Indicates whether the user allows sharing data with third parties.
		 */
		thirdPartyDataSharingConsent: boolean;
	};

	/**
	 * Accessibility options to accommodate users with disabilities.
	 * Default fontSize is 16 (pixels). Valid range: 10 to 24.
	 * Default for reducedMotion and highContrast is false.
	 */
	accessibilityOptions: {
		/**
		 * Font size in pixels. Default: 16. Valid range: 10 to 24.
		 */
		fontSize: number;
		highContrast: boolean; // Default: false
		reducedMotion: boolean; // Default: false
	};
}

/**
 * Secondary settings that enhance the user experience by offering customization and convenience.
 */
export interface UserSecondarySettings {
	/**
	 * Notification preferences.
	 */
	notifications: {
		enabled: boolean;
		sound: boolean;
		frequency: "real-time" | "daily" | "never";
	};

	/**
	 * Preferences for application updates.
	 */
	updatePreferences: {
		autoUpdate: boolean;
		updateNotifications: boolean;
	};

	/**
	 * Security settings for data protection.
	 * Default autoLockTimeout is 5 minutes. Valid range: 1 to 60.
	 * Default for dataEncryption is true, indicating encryption is enabled by default.
	 */
	security: {
		/**
		 * Auto-lock timeout in minutes. Default: 5. Valid range: 1 to 60.
		 */
		autoLockTimeout: number;
		dataEncryption: boolean; // Default: true
	};

	/**
	 * Indicates whether the application should operate in offline mode.
	 * Default: false, allowing outgoing connections.
	 */
	offline: boolean; // Default: false

	/**
	 * Cloud sync and backup options.
	 */
	cloudSync: {
		enabled: boolean;
		frequency: "daily" | "weekly" | "manual";
	};
}

/**
 * Tertiary settings for personalizing and enhancing the overall user experience.
 */
export interface UserTertiarySettings {
	/**
	 * UI customization options.
	 * Default layout is "default". Color scheme should define at least "primary" and "background" colors.
	 */
	uiCustomization: {
		/**
		 * Layout preference. Default: "default". Options: "default", "compact", "spacious".
		 */
		layout: "default" | "compact" | "spacious";
		/**
		 * Color scheme with key-value pairs defining colors. Example default: { primary: "#007bff", background: "#ffffff" }.
		 */
		colorScheme: Record<string, string>;
	};

	/**
	 * Startup behavior settings.
	 */
	startupBehavior: {
		launchOnStartup: boolean;
		startMinimized: boolean;
		restoreLastSession: boolean;
	};

	/**
	 * User-defined content filters.
	 */
	contentFilters: Record<string, boolean | string>; // E.g., { "adult-content": false, "source": "trustedOnly" }

	/**
	 * Customizable keyboard shortcuts for improved productivity.
	 */
	shortcuts: Record<string, string>;
}

/**
 * Combines ass userStore settings into a single type
 * for comprehensive user settings management.
 */
export type UserSettings = UserPrimarySettings & UserSecondarySettings & UserTertiarySettings;

/**
 * Represents the status and essential details of a download process.
 */
export interface DownloadStatus {
	/**
	 * The current state of the download.
	 */
	state: DownloadState;

	/**
	 * An optional error message providing details if the download has failed.
	 */
	error?: string;

	/**
	 * The date and time when the download was initiated.
	 */
	startDate: Date;
}

/**
 * A record mapping unique identifiers (e.g., URLs) to their corresponding download status.
 * This facilitates tracking multiple downloads simultaneously.
 */
export type DownloadsSettings = Record<string, unknown>;

/**
 * Represents a preview of a marketplace entry, which can be either text or an image.
 */
export interface MarketplaceEntryPreview {
	/**
	 * The type of preview, either a textual description or an image URL.
	 */
	type: "text" | "image";

	/**
	 * The content of the preview, which could be a text description or an image URL.
	 */
	content: string;
}

/**
 * Details about a specific file related to a marketplace entry, including its filename,
 * whether it's required, and its variant.
 */
export interface MarketplaceFile {
	/**
	 * The name of the file.
	 */
	filename: string;

	/**
	 * Indicates whether this file is required for the entry to function properly.
	 */
	required?: boolean;

	/**
	 * A string identifying the variant of the file, providing context for its use or purpose.
	 */
	variant: string;
}

/**
 * Contains detailed information about a marketplace entry, including its type,
 * supported architecture, and other metadata.
 */
export interface MarketplaceEntryInfo {
	/**
	 * The type of entry, such as 'plugin', 'theme', etc.
	 */
	type: string;

	/**
	 * The supported architecture for the entry, e.g., 'x64', 'arm', etc.
	 */
	architecture: string;

	/**
	 * The title of the marketplace entry.
	 */
	title: string;

	/**
	 * The author or creator of the entry.
	 */
	author: string;

	/**
	 * A link to where more information about the entry can be found.
	 */
	link: string;

	/**
	 * The license under which the entry is distributed.
	 */
	license: string;

	/**
	 * Indicates whether the entry is hosted on a Git repository.
	 */
	git: true;

	/**
	 * An optional array of `MarketplaceFile` objects associated with the entry.
	 */
	files?: MarketplaceFile[];
}

/**
 * Represents a complete marketplace entry, including its previews, detailed information,
 * and a unique identifier.
 */
export interface MarketplaceEntry {
	/**
	 * An array of `MarketplaceEntryPreview` objects providing a visual or textual preview of the entry.
	 */
	previews: MarketplaceEntryPreview[];

	/**
	 * Detailed information about the entry as described in `MarketplaceEntryInfo`.
	 */
	info: MarketplaceEntryInfo;

	/**
	 * A unique identifier for the marketplace entry.
	 */
	id: string;
}

/**
 * A flexible structure to hold marketplace entries, allowing for nested categorization
 * or flat listing. Each entry is indexed by a unique key, which can correspond to an
 * `MarketplaceEntry` or further nested `MarketplaceSettings` for hierarchical organization.
 */
export interface MarketplaceSettings {
	[key: string]: MarketplaceEntry | MarketplaceSettings;
}

/**
 * Defines a structure for storing key-value pairs, where both the key and the value are strings.
 * This structure is particularly suited for storing sensitive information such as API keys,
 * making it easy to retrieve them by their identifiers throughout the application.
 *
 * The `KeysSettings` type is intended for use with the `keysStore`, providing a straightforward
 * way to manage and access various configuration settings or secrets securely. Each record
 * represents a unique identifier mapped to its corresponding value (e.g., an API key).
 */
export type KeysSettings = Record<string, string>;

/**
 * Defines the structure for inventory settings, specifically categorizing files by type.
 *
 * This interface is used to manage and access files that the application interacts with,
 * organizing them into distinct categories based on their type. Each category consists of
 * an array of objects, where each object represents a file in that category and contains
 * information about the file's path and a URL for accessing it.
 *
 * @interface
 * @property {Object} files - An object containing arrays of file information, categorized by file type.
 * @property {Array<{filePath: string; url: string}>} files.image - An array of objects representing image files,
 *           each containing the file's path (`filePath`) and a URL (`url`) for access.
 * @property {Array<{filePath: string; url: string}>} files.markdown - An array of objects representing markdown files,
 *           similar to `files.image` but for markdown (.md) files.
 * @property {Array<{filePath: string; url: string}>} files.audio - An array of objects for audio files,
 *           organizing files that are primarily meant to be listened to (e.g., mp3, wav).
 * @property {Array<{filePath: string; url: string}>} files.other - An array for files that do not fit into
 *           the above categories, serving as a catch-all for miscellaneous file types.
 */
export interface InventorySettings {
	files: {
		image: { filePath: string; id: string }[];
		markdown: { filePath: string; id: string }[];
		audio: { filePath: string; id: string }[];
		other: { filePath: string; id: string }[];
	};
}
