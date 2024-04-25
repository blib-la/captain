import fsp from "node:fs/promises";
import path from "path";

import { protocol } from "electron";

import { LOCAL_PROTOCOL } from "#/constants";

/**
 * Handles requests to a custom protocol for serving local files in an Electron application.
 * This function is part of the setup to allow Electron to serve local files using a custom protocol,
 * identified by `LOCAL_PROTOCOL`, which is a constant containing the protocol name (e.g., 'captain').
 *
 * The custom protocol handler is designed to intercept requests made to this protocol, parse the
 * requested file's path from the URL, and serve the file directly from the disk. This approach enables
 * the loading of local resources in a secure and controlled manner, bypassing the limitations of the
 * `file://` protocol in web contexts, and providing more flexibility in handling file requests.
 *
 *
 * Usage:
 * 1. Register the custom protocol and its handler early in the application's lifecycle, ideally in the
 *    main process's `app.whenReady()` callback.
 * 2. Construct URLs using the custom protocol to request local files, formatting the path as follows:
 *    `${LOCAL_PROTOCOL}://<absolutePathOnDisk>`, where `<absolutePathOnDisk>` is the full path to the file,
 *    with backslashes (`\`) replaced by forward slashes (`/`) and properly URL-encoded to handle spaces
 *    and special characters.
 *
 *
 * This function normalizes the file path extracted from the URL, reads the file from the disk, and
 * returns a response object containing the file content. If the file cannot be found or read, it
 * logs an error and returns a 404 response.
 *
 * The `Content-Type` header is set to "application/octet-stream" by default, which treats the file
 * as binary data. You may need to adjust this based on the type of files you are serving to ensure
 * proper handling by the client.
 *
 * Important:
 * - Ensure the custom protocol is registered using `protocol.registerSchemesAsPrivileged` before setting
 *   up the handler to grant it necessary privileges, such as bypassing CSP restrictions.
 * - Proper error handling and validation are crucial to prevent security issues, such as directory
 *   traversal attacks.
 * - This setup assumes that the application has permission to access the files it attempts to serve,
 *   and appropriate security measures are in place to safeguard sensitive data.
 * @example
 * <img src={`${LOCAL_PROTOCOL}://C:/path/to/your/image.png`} />
 */
export function initLocalProtocol() {
	protocol.handle(LOCAL_PROTOCOL, async request => {
		const url = new URL(request.url);
		// Normalize the file path: convert URL path to a valid file system path
		const filePath = path.normalize(`${url.hostname}:${url.pathname}`);
		try {
			// Attempt to read the requested file from the disk
			const file = await fsp.readFile(filePath);
			// If successful, return the file content with a generic binary data MIME type
			return new Response(file, { headers: { "Content-Type": "application/octet-stream" } });
		} catch (error) {
			// Log and return an error response if the file cannot be read
			console.error(`Failed to read ${filePath}:`, error);
			return new Response("File not found", { status: 404 });
		}
	});
}
