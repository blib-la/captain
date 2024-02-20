import Seven from "node-7z";

export async function unpack(binary: string, source: string, target: string) {
	return new Promise<void>((resolve, reject) => {
		const extraction = Seven.extractFull(source, target, {
			$bin: binary,
		});

		extraction.on("end", () => {
			console.log("Extraction complete");
			resolve();
		});

		extraction.on("error", error => {
			console.error("Error extracting archive", error);
			reject(error);
		});
	});
}
