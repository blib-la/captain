import crypto from "node:crypto";

export function createPathHash(path: string): string {
	return crypto.createHash("sha256").update(path).digest("hex");
}
