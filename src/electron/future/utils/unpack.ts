import { unlink } from "node:fs/promises";

import Seven from "node-7z";

export async function unpack(
	binary: string,
	source: string,
	target: string,
	deleteAfterUnpack: boolean = false
) {
	return new Promise<void>((resolve, reject) => {
		const extraction = Seven.extractFull(source, target, {
			$bin: binary,
		});

		extraction.on("end", async () => {
			if (deleteAfterUnpack) {
				try {
					await unlink(source);
					resolve();
				} catch (error) {
					reject(error);
				}
			} else {
				resolve();
			}
		});

		extraction.on("error", error => {
			reject(error);
		});
	});
}
