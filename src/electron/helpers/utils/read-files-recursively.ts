import type { Dirent } from "node:fs";
import fsp from "node:fs/promises";
import path from "path";

/**
 * Recursively reads and collects file entries within a specified directory, filtering by file type if specified.
 * This enhanced version of the function allows for the specification of desired file types, returning only files
 * that match the provided types within the directory and all its subdirectories. The function returns a flat array
 * of Dirent objects representing the filtered directory entries. These entries can include files that match the specified
 * types, directories, or other filesystem objects present in the directory tree.
 *
 * @param {string} directory - The absolute path to the directory to be recursively read. Using an absolute path
 * avoids ambiguity in the filesystem's location.
 * @param {object} [options] - Optional parameters for file reading.
 * @param {string[]} [options.fileTypes] - An array of desired file extension types to filter the files by (e.g., ['.txt', '.jpg']).
 * Extensions should be specified with the dot for consistency (e.g., not 'txt' but '.txt').
 *
 * @returns {Promise<Dirent[]>} - A promise that resolves with an array of Dirent objects. Each object represents
 * a directory entry matching the specified file types or any directory entry if no types are specified.
 *
 * This function leverages Node.js's File System Promises API to asynchronously read directory contents with
 * the `withFileTypes` option to obtain Dirent instances directly. This method efficiently distinguishes between
 * files and directories without additional filesystem calls.
 *
 * The function recursively searches through all directories, aggregating file entries. If the `fileTypes` option
 * is provided, it filters the files to include only those with extensions matching the specified types.
 *
 * Implementing recursion with asynchronous filesystem operations allows for effective handling of complex directory
 * structures, though deep recursion levels should be approached with caution to avoid potential performance bottlenecks
 * or stack overflow errors in cases of extremely large or deep directory trees.
 *
 * Note: The function requires `fs.promises` and `path` modules from Node.js.
 *
 * @example
 * const directoryPath = '/path/to/directory';
 * readFilesRecursively(directoryPath, { fileTypes: ['.txt', '.md'] })
 *   .then(files => {
 *     files.forEach(file => {
 *       console.log(file.name);
 *     });
 *   })
 *   .catch(error => {
 *     console.error('An error occurred:', error);
 *   });
 */
export async function readFilesRecursively(
	directory: string,
	{ fileTypes }: { fileTypes?: string[] } = {}
): Promise<Dirent[]> {
	let files: Dirent[] = [];
	const items = await fsp.readdir(directory, { withFileTypes: true });

	for (const item of items) {
		const fullPath = path.join(directory, item.name);
		if (item.isDirectory()) {
			files = [...files, ...(await readFilesRecursively(fullPath, { fileTypes }))];
		} else if (!fileTypes || fileTypes.includes(path.extname(item.name))) {
			files.push(item);
		}
	}

	return files;
}
