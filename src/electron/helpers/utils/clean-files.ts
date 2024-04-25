import fs from "node:fs";
import fsp from "node:fs/promises";

import { globby } from "globby";

import { getCaptainData, getCaptainTemporary, getUserData } from "@/utils/path-helpers";

export async function cleanFiles() {
	if (fs.existsSync(getCaptainData("windows"))) {
		await fsp.rm(getCaptainData("windows"), { recursive: true });
	}

	if (fs.existsSync(getCaptainTemporary())) {
		await fsp.rm(getCaptainTemporary(), { recursive: true });
	}

	// Remove legacy top level window stores
	const oldStores = await globby(["STORE-WINDOW--*.json"], { cwd: getUserData() });
	await Promise.all(oldStores.map(async filePath => fsp.rm(filePath)));
}
