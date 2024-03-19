import type { DownloadState } from "./enums";

/**
 * Represents an item to be downloaded, including its source, destination, and other metadata.
 */
export interface DownloadItem {
	/**
	 * Unique identifier for each download request.
	 */
	id: string;

	/**
	 * The URL of the file to be downloaded.
	 */
	source: string;

	/**
	 * Local path where the file should be saved.
	 */
	destination: string;

	/**
	 * A user-friendly name or label for the download item, for UI display purposes.
	 */
	label: string;

	/**
	 * Time when the download request is sent from the client, represented as a Unix timestamp.
	 */
	createdAt: number;

	/**
	 * MIME type of the file being downloaded, if known beforehand. Optional.
	 */
	mimeType?: string;

	/**
	 * Whether to automatically unzip the file when download completes. Optional.
	 */
	unzip?: boolean;

	/**
	 * Current state of the download. Optional.
	 */
	state?: DownloadState;
	cancel?: () => void; // Add this line
}
