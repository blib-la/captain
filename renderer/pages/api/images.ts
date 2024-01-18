import path from "node:path";
import process from "node:process";
import os from "os";

import { execa } from "execa";
import type { NextApiRequest, NextApiResponse } from "next";
import { globby } from "globby";
import { getImages } from "@/server/getImages";

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse,
) {
  if (request.method === "POST") {
    const directory = request.body.directory.replaceAll("\\", "/");
    try {
      const glob = `${directory}/*`;
      const files = await globby(glob);
      const images = directory ? await getImages(directory) : [];
      response.status(200).json({ files, images, directory });
    } catch (error) {
      response
        .status(500)
        .json({ error: "Failed to get directory path.", directory });
    }
  } else {
    response.status(405).end(); // Method not allowed
  }
}
