import path from "node:path";
import process from "node:process";
import os from "os";

import { execa } from "execa";
import type { NextApiRequest, NextApiResponse } from "next";

async function runBlip(directory: string) {
  try {
    const pathToPythonScript = path.join(
      process.cwd(),
      "scripts/caption_blip.py",
    );

    const { stdout } = await execa("python", [pathToPythonScript, directory]);
    return stdout.trim();
  } catch (error) {
    console.error(error);
    return null;
  }
}

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse,
) {
  if (request.method === "POST") {
    const directory = request.body.directory.replaceAll("\\", "/");
    console.log("here we are");
    try {
      switch (os.platform()) {
        case "win32":
        case "linux":
        case "darwin":
          try {
            const result = await runBlip(directory);
            response.status(200).json({ result });
          } catch (error) {
            response
              .status(500)
              .json({ error: "Failed to get directory path." });
          }

          break;

        default:
          response
            .status(500)
            .json({ error: "Operating system not supported." });
      }
    } catch (error) {
      response.status(500).json({ error: "Failed to get directory path." });
    }
  } else {
    response.status(405).end(); // Method not allowed
  }
}
