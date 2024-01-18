import { writeFile } from "node:fs/promises";
import path from "node:path";

import { getRootFolder } from "@server/path";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(request: NextApiRequest, response: NextApiResponse) {
	const rootFolder = getRootFolder(request.cookies);
	const name = request.query.name as string;
	const content = request.body.content as string;
	switch (request.method) {
		case "POST":
			try {
				const file = path.join(rootFolder, `${name}.txt`);
				await writeFile(file, content);
				response.status(204).end();
			} catch (error) {
				console.error(error);
				response.status(500).send({ message: "An unexpected error occurred." });
			}

			break;
		default:
			response.setHeader("Allow", ["POST"]);
			response.status(405).send({ message: "Method Not Allowed." });
	}
}
